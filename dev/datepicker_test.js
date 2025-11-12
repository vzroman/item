
import {item} from "../dist/item.js";

export function run( $container ){

    const tabs = [];

    for (let i = 0; i < 15; i++) {
        tabs.push( {
            text: "T"+(i+1),
            view: item.view.controls.Button,
            options:{
                text:"Button in Tab "+(i+1),
            }
        } )
    }

    const a = new item.view.layout.TabStrip({
        $container,
        tabs, 
        horizontal: true,
        active: 0,
    })

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