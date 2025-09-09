(function(){

    const PRODUCTS_KEY = "myCarouselProducts";

    const init = () => {

        if(!isHomePage()) {
            console.log("Wrong Page!")
            return ;
        }
        //html'i oluşturma fonksiyonu
        buildHTML();
        //veri yükleme fonksiyonu
        fetchProducts();
        //event listener ekleme fonksiyonu
    }

    function isHomePage() {
        return window.location.href === "https://www.e-bebek.com/"
    }

    async function fetchProducts() {
        const url = "https://gist.githubusercontent.com/sevindi/8bcbde9f02c1d4abe112809c974e1f49/raw/9bf93b58df623a9b16f1db721cd0a7a539296cf0/products.json"
        let products = null;

        const cached = localStorage.getItem(PRODUCTS_KEY);
        if (cached) {
            try {
                products = JSON.parse(cached);
            } catch (e) {
                localStorage.removeItem(PRODUCTS_KEY);
            }
        }

        if (!products) {
            try {
                const response = await fetch(url);
                if(!response.ok) {
                    throw new Error(`Response status: ${response.status}`);
                }
                products = await response.json();
                localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
            } catch (error) {
                console.error(error);
                return;
            }
        }

        const carouselInner = document.querySelector('.carousel-inner');
        if (!carouselInner) {
            console.error("carousel-inner bulunamadı!");
            return;
        }
        carouselInner.innerHTML = products.map(p => 
            `
            <div class="product">
                <img src="${p.img}" alt="${p.name}" width="100">
                    <p>${p.name}</p>
                    <p>Fiyat: ${p.price} TL</p>
                </div>
            </div>
            `
        ).join('');
    }

    const buildHTML = () => {
        const container = document.createElement('div');
        container.className = "my-carousel-container";
        container.innerHTML = 
        `
        <h2>Beğenebileceğinizi düşündüklerimiz</h2>
        <div class="carousel">
            <div class="carousel-inner"></div>
        </div>
        `;

        const heroBanner = document.querySelector('.hero.banner');
        if(heroBanner) {
            heroBanner.insertAdjacentElement('afterend', container);
        }else{
            console.error("hero-banner bulunamadı!");
        }

    }


    init();
})();