
import {item} from "../dist/item.js";

export function run( $container ){

    item.dialogs.error( "some error" ).then(()=>console.log("error close"));

    item.dialogs.yes_no( "some question?" ).then(()=>console.log("yes"),()=>console.log("no"));

    item.dialogs.notify( "some notification" ).then(()=>console.log("notify close"));

}
