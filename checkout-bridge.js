document.addEventListener('DOMContentLoaded',()=>{
const buyBtn=document.getElementById('btn-comprar');
const colorError=document.getElementById('color-error');
const getSelectedColor=()=>{const c=document.querySelector('input[name="product-color"]:checked');return c?c.value:''};
function saveDraft(){const draft={productName:'Livro Infantil Bilíngue Interativo com Som',unitPrice:49.90,quantity:1,color:getSelectedColor(),updatedAt:new Date().toISOString()};localStorage.setItem('futurekids_checkout',JSON.stringify(draft));return draft;}
if(buyBtn){buyBtn.addEventListener('click',(e)=>{const color=getSelectedColor();if(!color){e.preventDefault();if(colorError)colorError.style.display='block';const c=document.querySelector('.color-selection-container');if(c)c.scrollIntoView({behavior:'smooth',block:'center'});return;}if(colorError)colorError.style.display='none';const draft=saveDraft();const target=new URL('checkout.html',window.location.href);target.searchParams.set('color',draft.color);target.searchParams.set('qty','1');e.preventDefault();window.location.href=target.toString();});}
document.querySelectorAll('input[name="product-color"]').forEach(input=>input.addEventListener('change',()=>{if(colorError)colorError.style.display='none';saveDraft();}));
});