package phil294.ls.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import javax.validation.constraints.Min;
import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * User: phi
 * Date: 07.03.17
 * .  .___.
 * .  {o,o}
 * . /)___)
 * . --"-"--
 */
@Entity
@Table(name="products")
public class Product implements Serializable // todo seri notw?
{
	@Id
	@GeneratedValue
	private Integer id;
	@JsonIgnore // geht den endnutzer nichts an // todo mögliche admins aber schon
	@Min(1)
	private Integer user;
	@Size(min = 1, max = 64)
	private String name;
	@Size(min = 0, max = 255)
	private String description = "";
	@Size(min = 1, max = 64)
	private String picture;
	// fixme 20170612 interest
	
	@Transient
	private Map<Integer, String> productData = new HashMap<>(); // <attributeId, value>
	
	///////////////////////////////
	
	public Map<Integer, String> getProductData()
	{
		return productData;
	}
	
	public void setProductData(Map<Integer, String> productData)
	{
		this.productData = productData;
	}
	
	public void setUser(Integer user)
	{
		this.user = user;
	}
	
	public Integer getId()
	{
		return id;
	}
	
	public void setId(Integer id)
	{
		this.id = id;
	}
	
	public int getUser()
	{
		return user;
	}
	
	public void setUser(int user)
	{
		this.user = user;
	}
	
	public String getName()
	{
		return name;
	}
	
	public void setName(String name)
	{
		this.name = name;
	}
	
	public String getDescription()
	{
		return description;
	}
	
	public void setDescription(String description)
	{
		this.description = description;
	}
	
	public String getPicture()
	{
		return picture;
	}
	
	public void setPicture(String picture)
	{
		this.picture = picture;
	}
}
