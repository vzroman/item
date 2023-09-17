
import {item} from "../dist/item.js";

export function run( $container ){

    item.dialogs.yes_no( "some question?" ).then(()=>console.log("yes"),()=>console.log("no"));

}
