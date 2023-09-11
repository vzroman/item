
import {item} from "../dist/item.js";

export function run( $container ){

    // const b = new item.view.controls.SelectList({
    //     $container,
    //     items: ["item 1", "item 2", "item 3"],
    //     events:{
    //         value:(val)=>{
    //             console.log(val);
    //         }
    //     }
    // })
    const a = new item.view.controls.ItemList({
        $container,
        item: {
            view: item.view.controls.SelectList,
            options: {
                items: ["item 1", "item 2", "item 3"],
                // events:{
                //     value:(val)=>{
                //         console.log(val);
                //     }
                // }
            }
        },
        // items: ["item 1", "item 2", "item 3"],
        // events:{
        //     value:(val)=>{
        //         console.log(111, val);
        //     }
        // }
    })

    // a.set({value: [
    //     ["item 1", "item 3"],
    //     ["item 3", "item 2"],
    // ]})

    // setTimeout(() => {
    //     a.set({value: ["item 2", "item 3"]})
    // }, 2000)

    // setTimeout(() => {
    //     a.set({items: ["item 1","item 2", "item 5", "item 6"]})
    // }, 5000)

}
