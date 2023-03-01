const { response } = require("express")
const { get } = require("../../config/connection")
const { post } = require("../../routes/user")

function addtoCart(proId){
    $.ajax({
        url:'/add-to-Cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#countOfcart').html()
                count=parseInt(count)+1
                $('#countOfcart').html(count)
            }
        }
    }) 
}



function changeQuantity(cartId,proId,userId,count){
    let quantity=parseInt(document.getElementById(proId).innerHTML)
    count=parseInt(count)
    $.ajax({
      url:'/change-product-quantity',
      data:{
        cart:cartId,
        product:proId,
        user:userId,
        count:count,
        quantity:quantity,
      },
      method:'post',
      success:(response)=>{
        if(response.removeproduct){
          alert('product remove from cart')
          location.reload()
        }else{
          document.getElementById(proId).innerHTML=quantity+count
          document.getElementById('totalAmount').innerHTML=response.total
        }
      }
    })
  }


  function removeItems(cartId,proId){
    $.ajax({
      url:'/remove-cart',
      data:{
      cart:cartId,
      product:proId
      },
      method:'post',
      success:(response)=>{
if(response.removeproduct){
  alert('are you sure you want to delete this product')
  location.reload()
}
      }
    })
  }




  //place order validating
  
  






