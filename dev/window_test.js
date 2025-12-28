import {item} from "../dist/item.js";

export function run( $container ){

    $container.on('click', function(e){

        new item.view.layout.Window({
            $container,
            title:"Animated Window",
            view:{
                view:item.view.primitives.Html,
                options:{ html:`<div>
                    <h3>Happy new Year!</h3>
                    <img src="https://i.ebayimg.com/images/g/M-QAAOSwXKddv6An/s-l1600.webp" style="width: 600px;height:auto"/>
                </div>` }
            },
            position: {
                top: e.pageY,
                left: e.pageX
            },
            width:600,
            height:450
        });
    });

    
}