((function(){
    const init = () => {
        console.log('sayfa yükleniyor...');
        //veri yükleme fonksiyonu
        fetchProducts();
        //html'i oluşturma fonksiyonu
        //css'i oluşturma fonksiyonu
        //event listener ekleme fonksiyonu
    }

    async function fetchProducts() {
        const url = "https://gist.githubusercontent.com/sevindi/8bcbde9f02c1d4abe112809c974e1f49/raw/9bf93b58df623a9b16f1db721cd0a7a539296cf0/products.json"
        try {
            const response = await fetch(url);
            if(!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const result = await response.json();
            console.log(result);
        } catch (error) {
            console.error(error.message);
        }
    }


    init();
})());