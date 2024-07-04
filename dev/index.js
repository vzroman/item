import {run as grid_test} from "./grid_test.js";
import {run as treeGrid_test} from "./treeGrid_test.js";
import {run as selectlist_test} from "./selectlist_test.js"
import {run as demo_test} from "./demo_test.js"
import {run as demo_collection} from "./demo_collection.js"
import {run as multiselect_test} from "./multiselect_test.js"
import {run as item_list_test} from "./item_list_test.js"
import {run as popups_test} from "./popups_test.js"
import {run as panel_test} from "./panel_test.js"
import {run as splitter_test} from "./splitter_test.js"
import {run as validate_input} from "./validate_input.js"
import {run as breadcrumbs} from "./breadcrumbs.js"


$(function () {

    const $container = $(`<div name="container" style="width: 80vw; height: 80vh"></div>`)
        .appendTo( $(`<div style="width: 100%; height: 100%; display: flex; justify-content: center;align-items: center"></div>`)
            .appendTo( $('body').css({width:"100%",height:"100%"})));



    grid_test( $container );

});