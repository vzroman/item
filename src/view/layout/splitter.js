import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import style from "./splitter.css";

export class Splitter extends ItemView {
    static options = {
        isVertical: {type: types.primitives.Bool, default: false},
        initSize: {type: types.primitives.Array, default: []}
    };

    static events = {
        onResize: true
    };

    markup() {
        const $markup = $(`<div class="${style.splitter} ${ this._options.isVertical ? style.vertical : ''}"></div>`);

        const $panes = this._options.$container.children();

        const orientation = this._options.isVertical ? "vertical" : "horizontal";

        const initSize = this._options.initSize;

        const count = $panes.length;
        for (let i=0; i < count; i++){

            const $pane = $(`<div class="${style.pane} pane"></div>`).appendTo( $markup );
            $($panes[i]).appendTo( $pane );
            if (typeof initSize[i] === "number" && initSize[i] !== null){
                $pane.css({"flex-basis": initSize[i] + "%"});
            }
        }

        for (let i=0; i < (count - 1); i++){

            const $handle = $(`<div 
                class="${style.splitbar}" 
                role="separator"    
                aria-orientation="${orientation}">
                <div class="${style.handle} handle"></div>
             </div>`);

            const $prev = $($panes[i]).parent();
            const $next = $($panes[i+1])?.parent();

            $handle.insertAfter( $prev );
            this._initHandle($handle, $prev, $next);

        }

        return $markup;
    }

    _initHandle($handle, $prevPane, $nextPane) {

        const isVertical = this._options.isVertical;

        let coords;

        let totalSize;

        const mouseMoveHandler = (e) => {
            const delta = {
                width: e.clientX - coords.e.clientX,
                height: e.clientY - coords.e.clientY
            };

            const dimension = isVertical ? 'height' : 'width';

            const paneDimensionDelta = Math.min(Math.max(delta[dimension], -coords.prev[dimension]), coords.next[dimension]);

            $prevPane.css({"flex-basis": ((coords.prev[dimension] + paneDimensionDelta) * 100) / totalSize + "%"});

            if ($nextPane) {
                $nextPane.css({
                    "flex-basis": ((coords.next[dimension] - paneDimensionDelta) * 100) / totalSize + "%"
                });
            }
        }

        const mouseUpHandler = () => {
            $handle.removeClass(style.resizing);
            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("mouseup", mouseUpHandler);
        }

        const mouseDownHandler = (e) => {

            // prevPane.width() doesnt return correct width i.e 48px instead of 0px
            coords = {
                e,
                prev: $prevPane[0].getBoundingClientRect(),
                next: $nextPane[0].getBoundingClientRect()
            };

            totalSize = isVertical
                ? this.$markup.height()
                : this.$markup.width();


            $handle.addClass(style.resizing);

            document.addEventListener("mousemove", mouseMoveHandler);
            document.addEventListener("mouseup", () => {
                mouseUpHandler();
                this._trigger("onResize");
            });
        }


        $handle.on("mousedown", mouseDownHandler);

    }





    // constructor(options) {
    //     const $container = options.$container;
    //
    //     super(options);
    //
    //     // TODO. This should be done in markup method
    //
    //     const $panes = $container.children();
    //
    //     const isVertical = this._options.isVertical;
    //
    //     //TODO. Do we really need this check?
    //     // if ($panes.length < 2) {
    //     //     throw new Error("Container must contain at least two elements.");
    //     // }
    //
    //     $container.empty();
    //
    //     const innerContainer = $(`<div class="${style.splitter}" style="height: 100%; width: 100%;"></div>`);
    //
    //     if (isVertical) {
    //         innerContainer.addClass(style.splitter_vertical);
    //     } else {
    //         innerContainer.addClass(style.splitter_horizontal);
    //     }
    //
    //     innerContainer.appendTo($container);
    //
    //     const $handles = [];
    //
    //     const $items = [];
    //
    //     // TODO. What for?
    //     let orderN = 0;
    //
    //     const orientation = this._options.orientation;
    //
    //     let containerValue;
    //
    //     $panes.each(function(index, $pane) {
    //
    //         $pane = $($pane);
    //
    //         if (orderN > 0) { orderN += 1; }
    //
    //         const paneShell = $(`<div class="${style.pane} ${style.pane_horizontal}"></div>`);
    //
    //         // TODO. Why do we need order?
    //         // It does not work properly if order is not specified
    //         const paneStyle = {"order": orderN + ""};
    //
    //         if (index + 1 !== $panes.length) {
    //             paneShell.addClass(style.static_pane);
    //         }
    //
    //         paneShell.css(paneStyle);
    //
    //         $pane.appendTo(paneShell);
    //
    //         orderN += 1;
    //
    //         $items.push(paneShell);
    //
    //         const $handle = $(`<div
    //             class="${style.splitbar} ${isVertical ? style.vertical : style.horizontal}"
    //             style="order: ${orderN}"
    //             role="separator"
    //             aria-orientation="${orientation}">
    //             <div class="${isVertical ? style.handle_v : style.handle_h}"></div>
    //         </div>`);
    //
    //         if (index + 1 !== $panes.length) {
    //             $handles.push($handle);
    //             $items.push($handle);
    //         }
    //     });
    //
    //     $items.forEach(i => $(i).appendTo(innerContainer));
    //
    //     const _this = this;
    //
    // }
}

Splitter.extend();
