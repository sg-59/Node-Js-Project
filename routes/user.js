const { response } = require("express");
var express = require("express");
const session = require("express-session");
const { resolve } = require("promise");
var router = express.Router();
var userhelpers = require("../helpers/user-helper");
var producthelpers = require("../helpers/product-helpers");
const { PRODUCT_HELPERS } = require("../config/collection");

/* GET home page. */
var varifylogin = (req, res, next) => {
  if (req.session.userLogedin) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = 0;
  if (req.session.user) {
    let product = await userhelpers.getcartProducts(req.session.user._id);
    if (product.length > 0) {
      cartCount = await userhelpers.getcartCount(req.session.user._id);
    }
  }

  producthelpers.getallProduct().then((products) => {
    res.render("user/index", { user, products, cartCount });
  });
});
router.get("/login", (req, res) => {
  if (req.session.userLogedin) {
    res.redirect("/");
  } else {
    res.render("user/login");
  }
});
router.get("/signup", (req, res) => {
  if (req.session.userLogedin) {
    res.redirect("/");
  } else {
    res.render("user/signup");
  }
});
router.post("/signup", (req, res) => {
  userhelpers.doSignup(req.body).then((data) => {
    req.session.userLogedin = true;
    req.session.user = data;
    if (req.files) {
      let images = req.files.Images;
      images.mv("./public/imageProfile/" + data + ".jpg");
    }
    res.redirect("/login");
  });
});
router.post("/login", (req, res) => {
  userhelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userLogedin = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      res.redirect("/login");
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.user = null;
  req.session.userLogedin = false;
  res.redirect("/");
});
router.get("/cart", varifylogin, async (req, res) => {
  let products = await userhelpers.getcartProducts(req.session.user._id);
  let total = 0;
  if (products.length > 0) {
    total = await userhelpers.getTotalAmount(req.session.user._id);
  }
  res.render("user/cart", { products, user: req.session.user, total });
});
router.get("/add-to-Cart/:id", function (req, res) {
  userhelpers.addtoCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});
router.post("/change-product-quantity", (req, res, next) => {
  userhelpers.changeProductQuantity(req.body).then(async (response) => {
    let products = await userhelpers.getcartProducts(req.body.user);
    if (products.length > 0) {
      response.total = await userhelpers.getTotalAmount(req.body.user);
    }
    res.json(response);
  });
});
router.post("/remove-cart", (req, res) => {
  userhelpers.removecartItems(req.body).then((response) => {
    res.json(response);
  });
});
router.get("/place-order", varifylogin, async (req, res) => {
  let products = await userhelpers.getcartProducts(req.session.user._id);
  if (products.length > 0) {
    total = await userhelpers.getTotalAmount(req.session.user._id);
  }
  res.render("user/place-order", { total, user: req.session.user });
});
router.post("/place-order", async (req, res) => {
  let products = await userhelpers.getcartProductlist(req.body.userId);
  let product = await userhelpers.getcartProducts(req.session.user._id);
  if (product.length > 0) {
    total = await userhelpers.getTotalAmount(req.body.userId);
  }
  userhelpers.placeorder(req.body, products, total).then((orderId) => {
    if (req.body["payment-method"] == "cod") {
      res.json({ codSuccess: true });
    } else {
      userhelpers.generateRazorpay(orderId, total).then((response) => {
        res.json(response);
      });
    }
  });
});
router.get("/order-successful", varifylogin, (req, res) => {
  res.render("user/order-successful", { user: req.session.user });
});
router.get("/view-orders", (req, res) => {
  userhelpers.viewOrders(req.session.user._id).then((order) => {
    res.render("user/view-orders", { user: req.session.user, order });
  });
});
router.get("/viewProduct/:id", async (req, res) => {
  let cartProducts = await userhelpers.viewProductatCart(req.params.id);
  let buyProducts = await userhelpers.viewproductatBuy(req.params.id);
  console.log("buy products",buyProducts);
  res.render("user/viewProduct", {
    user: req.session.user,
    buyProducts,
    cartProducts,
  });
});

router.get("/place-order-buy/:id", varifylogin, async (req, res) => {
  let product = await producthelpers.productDetails(req.params.id);
  res.render("user/place-order-buy", { user: req.session.user, product });
});

router.post("/place-order-buy", async (req, res) => {
  let products = await producthelpers.productDetails(req.body.proId);
  userhelpers.placeorderbuy(req.body, products).then((response) => {
      if (req.body["payment-method"] == "cod") {
      res.json({ codSuccess: true })
    } else {
      userhelpers
        .generateRazorpay(response, products.Price)
        .then((response) => {
          res.json(response);
        });
    }
  });
});
router.get("/profile", varifylogin, (req, res) => {
  res.render("user/profile", { user: req.session.user });
});
router.get("/LtH", varifylogin, async (req, res) => {
  let cartCount = 0;
  if (req.session.user) {
    let product = await userhelpers.getcartProducts(req.session.user._id);
    if (product.length > 0) {
      cartCount = await userhelpers.getcartCount(req.session.user._id);
    }
  }

  userhelpers.LtHgetproducts().then((products) => {
    res.render("user/index", { products, user: req.session.user, cartCount });
  });
});
router.get("/HtL", varifylogin, async (req, res) => {
  let cartCount = 0;
  if (req.session.user) {
    let product = await userhelpers.getcartProducts(req.session.user._id);
    if (product.length > 0) {
      cartCount = await userhelpers.getcartCount(req.session.user._id);
    }
  }

  userhelpers.HtLgetproducts().then((products) => {
    res.render("user/index", { products, user: req.session.user, cartCount });
  });
});
router.get("/myordersList", varifylogin, (req, res) => {
  userhelpers.myordersList(req.session.user._id).then((order) => {
    res.render("user/myorderList", { user: req.session.user, order });
  });
});
router.get("/cancelProduct/:id", varifylogin, (req, res) => {
  userhelpers.cancelorderdetails(req.params.id);
  userhelpers.cancelproductview(req.session.user._id).then((data) => {

    res.render("user/cancelProduct", { user: req.session.user, data });
    
  });
});
router.get("/cancelProductview", varifylogin, (req, res) => {
  userhelpers.cancelproductview(req.session.user._id).then((data) => {
    res.render("user/cancelProduct", { user: req.session.user, data });
  });
});
router.get("/showFulldetails/:id", varifylogin, async (req, res) => {
  let cartCount = 0;
  if (req.session.user) {
    let product = await userhelpers.getcartProducts(req.session.user._id);
    if (product.length > 0) {
      cartCount = await userhelpers.getcartCount(req.session.user._id);
    }
  }
  let data = await userhelpers.showFulldetails(req.params.id);
  res.render("user/showFulldetails", {
    data,
    cartCount,
    user: req.session.user,
  });
});
router.get("/editProfile", varifylogin, (req, res) => {
  res.render("user/editProfile", { user: req.session.user });
});
router.post("/editProfile", varifylogin, (req, res) => {
  console.log("checking user id", req.body);
  console.log("checking user data", req.session.user._id);
  userhelpers.editProfile(req.session.user._id, req.body).then((userData) => {
    if (req.files) {
      userId = req.session.user._id;
      let images = req.files.Images;
      images.mv("./public/imageProfile/" + userId + ".jpg");
    }
    res.redirect("/login");
  });
});
router.post("/verify-payment", (req, res) => {
  userhelpers
    .verifyPayment(req.body)
    .then(() => {
      userhelpers.onlinestatusChanged(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false });
    });
});

module.exports = router;
