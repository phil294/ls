import { validateOrReject } from 'class-validator';
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';
import { AttributeType } from './Attribute';
import ProductDatum from './ProductDatum';

/**
 * verified === false
 * uniq(user, product, attribute)
 * C R ~U~ D
 */
@Entity()
class ProductDatumProposal extends ProductDatum {
    @Column()
    public attribute!: string; // objid? todo: call attribute_id? / joins? / valid
    public product!: string; // todo ^
    // votes
    // comments

    public constructor(init: Partial<ProductDatumProposal>) {
        super();
        Object.assign(this, init);
    }

}

export default ProductDatumProposal;
