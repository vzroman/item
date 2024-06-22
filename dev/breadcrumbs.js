
import {item} from "../dist/item.js";

export function run( $container ){

    const bc = new item.view.widgets.Breadcrumbs({
        $container,
        initPath: [
            {
                title:"level1",
                callback:()=>console.debug("on level 1"),
                levelItems:[
                    { title:"level1 item2", callback:()=>console.debug("on level 1 item2") }
                ]
            },
            {
                title:"level2",
                callback:()=> console.debug("on level 2")
            }
        ]
    });

    setTimeout(()=>bc.expandLevel([
        {title:"new item", callback:()=>console.log("on new item")}
    ]), 5000);
    // const b = new item.view.controls.NumberInput({
    //     $container,
    //     step:1,
    //     events:{
    //         value:(val)=>{
    //             console.log(val);
    //         }
    //     }
    // })

    // const c = new item.view.controls.NumberInput({
    //     $container,
    //     validate:{
    //         max: 200
    //     },
    //     step:1,
    //     events:{
    //         value:(val)=>{
    //             console.log(val);
    //         }
    //     }
    // })

    // const d = new item.view.controls.NumberInput({
    //     $container,
    //     validate:{
    //         min: 12,
    //         max: 200
    //     },
    //     step:1,
    //     events:{
    //         value:(val)=>{
    //             console.log(val);
    //         }
    //     }
    // })

    // const e = new item.view.controls.NumberInput({
    //     $container,
    //     validate:{
    //         min: 12
    //     },
    //     step:1,
    //     events:{
    //         value:(val)=>{
    //             console.log(val);
    //         }
    //     }
    // })
}