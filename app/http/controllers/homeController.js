const Menu = require('../../models/menu');

function homeController()
{
    return {
        async index(req, res)
        {
            const pizzas = await Menu.find({});
            // console.log(pizzas);
            // res.send('hi');
            res.render('home', { pizzas });
        }
    }
}

module.exports=homeController;