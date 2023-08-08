import {run as grid_test} from "./grid_test.js";
import {run as treeGrid_test} from "./treeGrid_test.js";
import {run as selectlist_test} from "./selectlist_test.js"
import {run as demo_test} from "./demo_test.js"
import {run as demo_collection} from "./demo_collection.js"


$(function () {

    const $container = $(`<div name="container" style="display: grid; grid-template-columns: 1fr 1fr;width: 20vw; height: 10vh"></div>`)
        .appendTo( $(`<div style="width: 100%; height: 100%; display: flex; justify-content: center;align-items: center"></div>`)
            .appendTo( $('body').css({width:"100%",height:"100%"})));



    treeGrid_test( $container );

});