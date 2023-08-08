
import {item} from "../dist/item.js";

export function run( $container ){

    const a = new item.view.controls.SelectList({
        $container,
        items: ["item 1", "item 2", "item 3"],
        events:{
            value:(val)=>{
                console.log(val);
            }
        }
    })

    setTimeout(() => {
        a.set({value: ["item 2", "item 3"]})
    }, 2000)

    setTimeout(() => {
        a.set({items: ["item 1","item 2", "item 5", "item 6"]})
    }, 5000)

}
