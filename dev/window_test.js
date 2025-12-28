import {item} from "../dist/item.js";

export function run( $container ){
    const dialog = new item.view.layout.Window({
        $container,
        title:"Some title",
        view:{
            view:item.view.primitives.Html,
            options:{ html:'<h1>Window works!</h1>' }
        },
        // events:{ destroy:resolve }
    });
}