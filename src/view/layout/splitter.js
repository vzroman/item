import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import style from "./splitter.css";

export class Splitter extends ItemView {
    static options = {
        isVertical: {type: types.primitives.Bool, default: false}
    };

    static events = {onResize: true};

    constructor(options) {
        const $container = options.$container;

        super(options);

        // TODO. This should be done in markup method

        const $panes = $container.children();

        const isVertical = this._options.isVertical;

        //TODO. Do we really need this check?
        // if ($panes.length < 2) {
        //     throw new Error("Container must contain at least two elements.");
        // }

        $container.empty();

        const innerContainer = $(`<div class="${style.splitter}" style="height: 100%; width: 100%;"></div>`);

        if (isVertical) {
            innerContainer.addClass(style.splitter_vertical);
        } else {
            innerContainer.addClass(style.splitter_horizontal);
        }

        innerContainer.appendTo($container);
        
        const $handles = [];

        const $items = [];

        // TODO. What for?
        let orderN = 0;

        const orientation = this._options.orientation;

        let containerValue;

        $panes.each(function(index, $pane) {
           
            $pane = $($pane);

            if (orderN > 0) { orderN += 1; }
            
            const paneShell = $(`<div class="${style.pane} ${style.pane_horizontal}"></div>`);

            // TODO. Why do we need order? 
            // It does not work properly if order is not specified
            const paneStyle = {"order": orderN + ""};

            if (index + 1 !== $panes.length) {
                paneShell.addClass(style.static_pane);
            }

            paneShell.css(paneStyle);

            $pane.appendTo(paneShell);

            orderN += 1;

            $items.push(paneShell);

            const $handle = $(`<div 
                class="${style.splitbar} ${isVertical ? style.vertical : style.horizontal}" 
                style="order: ${orderN}" 
                role="separator"    
                aria-orientation="${orientation}">
                <div class="${isVertical ? style.handle_v : style.handle_h}"></div>
            </div>`);

            if (index + 1 !== $panes.length) { 
                $handles.push($handle);
                $items.push($handle);
            } 
        });

        $items.forEach(i => $(i).appendTo(innerContainer));

        const _this = this;

        $handles.forEach(function(item, idx) {
            const prevPane = item.prev();
            const nextPane = item.next();

            let coords;

            item.on("mousedown", mouseDownHandler);

            function mouseDownHandler(e) {
                // prevPane.width() doesnt return correct width i.e 48px instead of 0px

                const {width: firstWidth, height: firstHeight} = prevPane[0].getBoundingClientRect();
                const {width: secondWidth, height: secondHeight} = nextPane[0].getBoundingClientRect();

                coords = {
                    e,
                    prev:{width: firstWidth, height: firstHeight},
                    next:{width: secondWidth, height: secondHeight}
                };

                containerValue = innerContainer?.width();

                if (isVertical) {
                    containerValue = innerContainer?.height();
                }

                item.addClass(style.resizing);
              
                document.addEventListener("mousemove", mouseMoveHandler);
                document.addEventListener("mouseup", () => {
                    mouseUpHandler();
                    _this._trigger("onResize");
                });
            }

            function mouseMoveHandler(e) {
                const delta = {
                    width: e.clientX - coords.e.clientX,
                    height: e.clientY - coords.e.clientY
                };

                const styles = {};

                const dimension = isVertical ? 'height' : 'width';

                const paneDimensionDelta = Math.min(Math.max(delta[dimension], -coords.prev[dimension]), coords.next[dimension]);

                styles.prev = {"flex-basis": ((coords.prev[dimension] + paneDimensionDelta) * 100) / containerValue + "%"};

                if (idx !== $handles.length - 1) {
                    styles.next = {
                        "flex-basis": ((coords.next[dimension] - paneDimensionDelta) * 100) / containerValue + "%"
                    };
                }

                prevPane.css(styles.prev);
                styles.next && nextPane.css(styles.next);            
            }

            function mouseUpHandler() {
                item.removeClass(style.resizing);
                document.removeEventListener("mousemove", mouseMoveHandler);
                document.removeEventListener("mouseup", mouseUpHandler);
            }
        });

    }
}

Splitter.extend();