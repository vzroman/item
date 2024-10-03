
import {item} from "../dist/item.js";

export function run( $container ){
    new item.view.controls.DatePicker({
        $container
    });
}