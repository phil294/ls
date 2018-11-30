import express from 'express';
import { NOT_FOUND, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { ObjectID } from 'mongodb';
import { In, Not } from 'typeorm';
import adminSecured from '../adminSecured';
import Attribute from '../models/Attribute';
import PrimaryProductDatum from '../models/PrimaryProductDatum';
import Product from '../models/Product';
import ProductDatum from '../models/ProductDatum';
import ProductDatumProposal from '../models/ProductDatumProposal';

const productRouter = express.Router();

productRouter.post('/', async (req, res) => {
    const { name, type } = req.body;
    const product = Object.assign(new Product(), {
        name,
        type,
        verified: false,
        data: {},
    });
    await product.save();
    res.send(product);
});

productRouter.delete('/:id', adminSecured, async (req, res) => {
    return await Product.delete({
        id: new ObjectID(req.params.id),
    });
});

/** Propose a ProductDatum */
productRouter.post('/:productId/data/:attributeId', async (req, res) => {
    const { productId, attributeId } = req.params;
    const { value, source } = req.body;
    const attribute = await Attribute.findOne({ _id: new ObjectID(attributeId) });
    if (!attribute) {
        res.status(NOT_FOUND).send('Attribute not found');
        return;
    }
    const productObjId = new ObjectID(productId);
    const product = await Product.findOne({
        where: { _id: productObjId },
        // select: [ `data.${attributeId}` ] // todo
    });
    if (!product) {
        res.status(NOT_FOUND).send('Product not found');
        return;
    }
    const datum = Object.assign(new ProductDatum(), {
        value, // todo validation? various places. typeorm?
        source,
        user: res.locals.userId,
    });
    const datumProposal = Object.assign(new ProductDatumProposal(), {
        ...datum,
        attribute: attribute.id,
        product: product.id,
    });
    const primaryDatum = Object.assign(new PrimaryProductDatum(), {
        ...datum,
    });

    try {
        await datumProposal.save();
    } catch (e) {
        res.status(UNPROCESSABLE_ENTITY).send(e.message);
        return;
    }

    // todo same as below
    if (!product.data) {
        product.data = {};
    }
    if (!product.data[attributeId]) {
        product.data[attributeId] = primaryDatum;
        await product.save();
        /*
        await Product.update({
            id: productObjId,
        }, {
            data: {
                [attributeId]: datumProposal
            },
        });
        */
    }
    res.send(datumProposal);
});

// todo types missing everywhere
productRouter.get('/', async (req, res) => {
    /*********** parse  *********/
    const type = req.query.t;
    const showerIds = req.query.sh
        .split(',').filter(Boolean);
    const sorters = req.query.so
        .split(',').filter(Boolean)
        .map((s: string) => {
            const split = s.split(':');
            return {
                attributeId: split[0],
                direction: split[1],
            };
        });
    const sortersFormatted = sorters
        .map((sorter: any) => ({
            attributeId: `data.${sorter.attributeId}.value`,
            direction: Number(sorter.direction),
        }))
        .reduce((all: object, sorter: any) => ({
            ...all,
            [sorter.attributeId]: sorter.direction,
        }), {});
    const filtersFormatted = req.query.f
        .split(',').filter(Boolean)
        .map((s: string) => {
            const split = s.split(':');
            return {
                attributeId: `${split[0]}.value`,
                condition: split[1],
                conditionValue: split[2],
            };
        })
        .reduce((all: object, filter: any) => ({
            ...all,
            // todo does not allow multiple filters for the same attribute. see typeorm#2396. fix when ready.
            [filter.attributeId]: filter.conditionValue,
        }), {});

    /*********** determine extraIds **********/
    const extraIdsAmount = req.query.c - showerIds.length;
    const extraIds = (await Attribute.find({
        select: ['id'],
        where: {
            type,
            id: Not(In(showerIds)),
        },
        take: extraIdsAmount,
        order: {
            interest: 'DESC',
        },
    })).map(attribute => attribute.id.toString());

    /************ compute *************/
    const sortersMissing = sorters
        .map((sorter: any) => sorter.attribute)
        .filter((attributeId: string) =>
            !extraIds.includes(attributeId) &&
            !showerIds.includes(attributeId));
    extraIds.splice(extraIds.length - 1 - sortersMissing.length, sortersMissing.length);
    const relevantAttributeIds = [...showerIds, ...extraIds, ...sortersMissing];

    /********** Search ***********/
    const products = await Product.find({
        where: {
            type,
            data: {
                ...filtersFormatted,
            },
        },
        select: [
            'id', 'name', 'verified', // todo
            // ...relevantAttributeIds.map(id => `data/${id}/primary`),
            'data',
        ],
        order: {
            ...sortersFormatted,
        },
    });
    // todo fix this with typeorm (idk)
    products.forEach((p: Product) => {
        if (!p.data) {
            p.data = {};
        }
    });

    /********** return **********/
    res.send({
        products,
        extraIds,
    });
});

export default productRouter;
