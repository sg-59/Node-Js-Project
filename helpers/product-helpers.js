var db=require('../config/connection')
var collection=require('../config/collection')
const { resolve, reject } = require('promise')
var bcrypt=require('bcrypt')
var objectid=require('mongodb').ObjectId

module.exports={
    addproduct:(data)=>{
        data.Price=parseInt(data.Price)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_HELPERS).insertOne(data).then((response)=>{
                resolve(response.insertedId)
            })
        })
    },

    getallProduct:()=>{
        return new Promise((resolve,reject)=>{
            let product=db.get().collection(collection.PRODUCT_HELPERS).find().toArray()
            resolve(product)
        })
    },
    deleteProduct:(data)=>{
        return new Promise((resolve,reject)=>{
db.get().collection(collection.PRODUCT_HELPERS).deleteOne({_id:objectid(data)}).then((data)=>{
    resolve(data)
})
        })
    },
    productDetails:(data)=>{
        return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_HELPERS).findOne({_id:objectid(data)}).then((data)=>{
                resolve(data)
            })
        })
    },
    updateDetails:(dataId,data)=>{
        data.Price=parseInt(data.Price)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_HELPERS).updateOne({_id:objectid(dataId)},{
                $set:{
                    Name:data.Name,
                    Model:data.Model,
                    Price:data.Price
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    adminSignup:(adminId)=>{
        return new Promise(async(resolve,reject)=>{
            adminId.Password=await bcrypt.hash(adminId.Password,10)
            db.get().collection(collection.ADMIN_HELPERS).insertOne(adminId).then((data)=>{
                console.log("data***",data);
                resolve(data.insertedId)
            })
        })
    },
    adminLogin:(adminId)=>{
        return new Promise(async(resolve,reject)=>{
            let admin=await  db.get().collection(collection.ADMIN_HELPERS).findOne({Email:adminId.Email})
            let response={}
            if(admin){
               bcrypt.compare(adminId.Password,admin.Password).then((status)=>{
                   if(status){     
   console.log("login successfully");
   response.status=true
   response.admin=admin
   resolve(response)
                   }else{
                       console.log("incorrect password");
                       resolve({status:false})
                   }
               })
               
            }else{
               console.log("email not matching");
               resolve({status:false})
            }
        })
    },
    allorders:()=>{
        return new Promise((resolve,reject)=>{
           let orders= db.get().collection(collection.ORDER_HELPERS).find().toArray()
           resolve(orders)
        })
    },
    allusers:()=>{
        return new Promise((resolve,reject)=>{
           let users= db.get().collection(collection.USER_HELPERS).find().toArray()
           resolve(users)
        })
    },
    cancelorders:()=>{
        return new Promise(async(resolve,reject)=>{
            let cancelOrders=await db.get().collection(collection.ORDERCANCEL_HELPERS).find().toArray()
            resolve(cancelOrders)
        })
    },

}