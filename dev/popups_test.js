
import {item} from "../dist/item.js";

export function run( $container ){

    item.dialogs.error( "some error" ).then(()=>console.log("closed"));

}
