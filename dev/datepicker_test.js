
import {item} from "../dist/item.js";

export function run( $container ){

    const a = new item.view.controls.DatePicker({
        $container,
       
        // placeholder:"192.128.1.1",
        events:{
            value:(val)=>{
                console.log(val);
            }
        }
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