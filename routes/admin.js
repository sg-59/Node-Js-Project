var express = require('express');
const { USER_HELPERS } = require('../config/collection');
var router = express.Router();
var producthelpers=require('../helpers/product-helpers')



var varifylogin=(req,res,next)=>{
  if(req.session.adminLogedin){
    next()
  }else{
    res.redirect('/admin')
  }
}

/* GET users listing. */
router.get('/view-product',varifylogin, function(req, res, next) {
  producthelpers.getallProduct(req.body).then((products)=>{
    res.render('admin/view-product',{products,admin:req.session.admin})
  })
 
});
router.get('/add-product',varifylogin,(req,res)=>{
  res.render('admin/add-product',{admin:req.session.admin})
})
router.post('/add-product',(req,res)=>{
  producthelpers.addproduct(req.body).then((response)=>{
    let images=req.files.Image
    images.mv('./public/images/'+response+'.jpg',(err,done)=>{
      if(!err){
        res.redirect('/admin/view-product')
      }
    })
  })
})
router.get('/delete-product/:id',varifylogin,(req,res)=>{
  let proId=req.params.id
  producthelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/view-product')
  })
})
router.get('/edit-product/:id',varifylogin, async(req,res)=>{
  let products=await producthelpers.productDetails(req.params.id )
    res.render('admin/edit-product',{products,admin:req.session.admin})

})

router.post('/edit-product/:id',(req,res)=>{
  producthelpers.updateDetails(req.params.id,req.body).then((response)=>{
    res.redirect('/admin/view-product')
    proId=req.params.id
    if(req.files){
      let images=req.files.Image
      images.mv('./public/images/'+proId+'.jpg')
        }
  })
})
router.get('/',(req,res)=>{
res.render("admin/adminLogin",{admin:true})
})
router.get('/adminSignup',varifylogin,(req,res)=>{
res.render("admin/adminSignup",{admin:req.session.admin})
})
router.post('/adminSignup',(req,res)=>{
  console.log('***',req.body);
  producthelpers.adminSignup(req.body).then((response)=>{
res.redirect('/admin')
  })
})

router.post('/adminLogin',(req,res)=>{
  producthelpers.adminLogin(req.body).then((response)=>{
    if(response.status){
      req.session.adminLogedin=true
      req.session.admin=response.admin
      res.redirect('/admin/view-product')
    }else{
      res.redirect('/admin')
    }
  })
})
router.get('/allorders',varifylogin,(req,res)=>{
  producthelpers.allorders().then((orders)=>{
    console.log("ok annannn",orders);
    res.render('admin/allorders',{orders,admin:req.session.admin})
  })

})
router.get('/allusers',varifylogin,(req,res)=>{
  producthelpers.allusers().then((users)=>{
    res.render('admin/allusers',{users,admin:req.session.admin})
  })

})
router.get('/adminLogout',(req,res)=>{
  req.session.admin=null
  req.session.adminLogedin=false
  res.redirect('/admin')
})
router.get('/cancelorders',varifylogin,(req,res)=>{
  producthelpers.cancelorders().then((cancelOrders)=>{
res.render('admin/cancelorders',{cancelOrders,admin:req.session.admin})
  })
})
router.get('/specificViewProduct/:id',varifylogin,(req,res)=>{
  res.render('admin/specificViewProduct',{admin:req.session.admin})
})
router.post('/specificViewProduct/:id',varifylogin,(req,res)=>{
  console.log('ethenth myr',req.params.id);
  producthelpers.specificViewProduct(req.params.id)
})
module.exports = router;
