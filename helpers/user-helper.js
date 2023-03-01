var db = require("../config/connection");
var collection = require("../config/collection");
var objectid = require("mongodb").ObjectId;
var bcrypt = require("bcrypt");
const { resolve, reject } = require("promise");
var objectid = require("mongodb").ObjectId;
const Razorpay = require("razorpay");

var instance = new Razorpay({
  key_id: "rzp_test_pKLRENWxgUTNjV",
  key_secret: "Odl3MtVlyg1mMYJ44jIHvnyS",
});

module.exports = {
  doSignup: (data) => {
    return new Promise(async (resolve, reject) => {
      data.Password = await bcrypt.hash(data.Password, 10);
      db.get()
        .collection(collection.USER_HELPERS)
        .insertOne(data)
        .then((response) => {
          resolve(response.insertedId);
        });
    });
  },
  doLogin: (data) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_HELPERS)
        .findOne({ Email: data.Email });
      let response = {};
      if (user) {
        bcrypt.compare(data.Password, user.Password).then((status) => {
          if (status) {
            console.log("login successfully");
            response.status = true;
            response.user = user;
            resolve(response);
          } else {
            console.log("incorrect password");
            resolve({ status: false });
          }
        });
      } else {
        console.log("email not matching");
        resolve({ status: false });
      }
    });
  },
  addtoCart: (proId, userId) => {
    let proObj = {
      item: objectid(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_HELPERS)
        .findOne({ user: objectid(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_HELPERS)
            .updateOne(
              { user: objectid(userId), "products.item": objectid(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_HELPERS)
            .updateOne(
              { user: objectid(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then(() => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectid(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_HELPERS)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  getcartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_HELPERS)
        .aggregate([
          {
            $match: { user: objectid(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_HELPERS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      console.log("cartitems", cartItems);
      resolve(cartItems);
    });
  },

  getcartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      total = await db
        .get()
        .collection(collection.CART_HELPERS)
        .aggregate([
          {
            $match: { user: objectid(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          // {
          //     $lookup:{
          //         from:collection.PRODUCT_HELPERS,
          //         localField:'item',
          //         foreignField:'_id',
          //         as:'product'
          //     }
          // },
          // {
          //     $project:{
          //       item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
          //     }
          // },
          {
            $group: {
              _id: null,
              total: { $sum: "$quantity" },
            },
          },
        ])
        .toArray();
      resolve(total[0].total);
    });
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_HELPERS)
          .updateOne(
            { _id: objectid(details.cart) },
            {
              $pull: { products: { item: objectid(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeproduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_HELPERS)
          .updateOne(
            {
              _id: objectid(details.cart),
              "products.item": objectid(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  removecartItems: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_HELPERS)
        .updateOne(
          { _id: objectid(details.cart) },
          {
            $pull: { products: { item: objectid(details.product) } },
          }
        )
        .then((response) => {
          resolve({ removeproduct: true });
        });
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      total = await db
        .get()
        .collection(collection.CART_HELPERS)
        .aggregate([
          {
            $match: { user: objectid(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_HELPERS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
            },
          },
        ])
        .toArray();
      resolve(total[0].total);
    });
  },
  getcartProductlist: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_HELPERS)
        .findOne({ user: objectid(userId) });
      resolve(cart.products);
    });
  },
  placeorder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      let status =
        order["payment-method"] === "cod"
          ? "order successfully and item shipped"
          : "pending";
      let orderObj = {
        deliveryStatus: {
          Name: order.firstname,
          Address: order.address,
          PIN: order.pin,
          Mobile: order.mobile,
        },
        UserId: objectid(order.userId),
        Paymentmethod: order["payment-method"],
        Products: products,
        Total: total,
        Status: status,
        Date: new Date(),
      };
      db.get()
        .collection(collection.ORDER_HELPERS)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_HELPERS)
            .deleteOne({ user: objectid(order.userId) });
          resolve(response.insertedId);
        });
    });
  },
  viewOrders: (userId) => {
    return new Promise((resolve, reject) => {
      let orders = db
        .get()
        .collection(collection.ORDER_HELPERS)
        .aggregate([
          {
            $match: { UserId: objectid(userId) },
          },
        ])
        .toArray();

      resolve(orders);
    });
  },
  viewProductatCart: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.ORDER_HELPERS)
        .aggregate([
          {
            $match: { _id: objectid(orderId) },
          },
          {
            $unwind: "$Products",
          },
          {
            $project: {
              item: "$Products.item",
              quantity: "$Products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_HELPERS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },

  placeorderbuy: (order, products) => {
    return new Promise((resolve, reject) => {
      if (order.coupenCode == "sg-098") {
        products.Price = products.Price - (products.Price * 20) / 100;
      }
      let status =
        order["payment-method"] === "cod"
          ? "order successfully and item shipped"
          : "pending";
      let orderObj = {
        deliveryStatus: {
          Name: order.firstname,
          Address: order.address,
          PIN: order.pin,
          Mobile: order.mobile,
        },
        UserId: objectid(order.userId),
        Paymentmethod: order["payment-method"],
        Products: products,
        Total: products.Price,
        Status: status,
        Date: new Date(),
      };
      db.get()
        .collection(collection.ORDER_HELPERS)
        .insertOne(orderObj)
        .then((response) => {
          resolve(response.insertedId);
        });
    });
  },

  viewproductatBuy: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let viewBuy = await db
        .get()
        .collection(collection.ORDER_HELPERS)
        .aggregate([
          {
            $match: { _id: objectid(orderId) },
          },
        ])
        .toArray();
      resolve(viewBuy);
    });
  },
  LtHgetproducts: () => {
    return new Promise(async (resolve, reject) => {
      let LtHproducts = await db
        .get()
        .collection(collection.PRODUCT_HELPERS)
        .aggregate([{ $sort: { Price: 1 } }])
        .toArray();
      resolve(LtHproducts);
    });
  },
  HtLgetproducts: () => {
    return new Promise(async (resolve, reject) => {
      let HtLproducts = await db
        .get()
        .collection(collection.PRODUCT_HELPERS)
        .aggregate([{ $sort: { Price: -1 } }])
        .toArray();
      resolve(HtLproducts);
    });
  },
  myordersList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orderList = await db
        .get()
        .collection(collection.ORDER_HELPERS)
        .aggregate([{ $match: { UserId: objectid(userId) } }])
        .toArray();
      resolve(orderList);
    });
  },
  cancelorderdetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let cancellorders = await db
        .get()
        .collection(collection.ORDER_HELPERS)
        .findOne({ _id: objectid(orderId) });
      db.get()
        .collection(collection.ORDERCANCEL_HELPERS)
        .insertOne(cancellorders)
        .then((data) => {
          resolve(data);
        });
      db.get()
        .collection(collection.ORDER_HELPERS)
        .deleteOne({ _id: objectid(orderId) });
    });
  },
  cancelproductview: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cancelItems = await db
        .get()
        .collection(collection.ORDERCANCEL_HELPERS)
        .aggregate([
          {
            $match: { UserId: objectid(userId) },
          },
        ])
        .toArray();
      resolve(cancelItems);
    });
  },
  showFulldetails: (proId) => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.PRODUCT_HELPERS)
        .findOne({ _id: objectid(proId) });
      resolve(data);
    });
  },
  editProfile: (userId, userData) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_HELPERS)
        .updateOne(
          { _id: objectid(userId) },
          {
            $set: {
              Name: userData.Name,
              Mobile: userData.Mobile,
              Address: userData.Address,
              Email: userData.Email,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  generateRazorpay: (orderId, total) => {
    console.log("orderId,total",orderId,total);
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log("razorpay order", order);
        resolve(order);
      });
    });
  },
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require ('crypto')
      let hmac=crypto.createHmac('sha256','Odl3MtVlyg1mMYJ44jIHvnyS')
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
     hmac= hmac.digest('hex')
     if(hmac==details['payment[razorpay_signature]']){
      resolve()
     }else{
      reject()
     }
    })
  },
  onlinestatusChanged:(orderId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_HELPERS).updateOne({_id:objectid(orderId)},
      {
        $set:{
          Status:'online order placed successfully'
        }
      }).then(()=>{
        resolve()
      })
    })
  },  
};
