import {item} from "../dist/item.js";

export function run( $container ){
    doTest();

    function doTest(){
        new item.view.controls.ColorPicker({
            $container:$(`<div></div>`).appendTo($container),
            hideText: true,
            value: "#0F92E9",
            events: {
                value: (v)=>{
                    console.log(v)
                    return v;
                }
            }
        });
    }
}