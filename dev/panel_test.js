
import {item} from "../dist/item.js";

export function run( $container ){

    $(`<div style="width: 100%;height: 500px; background-color: greenyellow">Test</div>`)
        .appendTo($container);
    const panel = new item.view.layout.Panel({
        $container,
        title:"Some title"
    })

}
