import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import style from "./splitter.css";

export class Splitter extends ItemView {
    static options = {
        // panes: {type: types.primitives.Array, default:[]},
        orientation: {type: types.primitives.String, default: "horizontal"},
    };

    constructor(options) {
        const $container = options.$container;
        // $container.css({position: "relative"});

        super(options);

        const $elements = $container.children();

        const isVertical = this._options.orientation === "vertical";

        if ($elements.length < 2) {
            throw new Error("Container must contain at least two elements.");
        }

        $container.empty();

        const innerContainer = $(`<div class="${style["e-splitter"]}" style="height: 100%; width: 100%;"></div>`);

        if (isVertical) {
            innerContainer.addClass(style["e-splitter-vertical"]);
        } else {
            innerContainer.addClass(style["e-splitter-horizontal"]);
        }

        innerContainer.appendTo($container);
        
        const $handles = [];

        const $items = [];

        let orderN = 0;

        const orientation = this._options.orientation;

        function getInitialFlexBasis(value, paneLength) {
            let initialFlexBasis = (value - (8 * paneLength - 1)) / paneLength;
            initialFlexBasis = ((initialFlexBasis / value) + ((8 / paneLength) / value)) * 100;
            return {initialFlexBasis, value};
        }
        
        const paneLength = $elements.length;

        let {initialFlexBasis, value: containerValue} = getInitialFlexBasis(isVertical ? innerContainer.height() : innerContainer.width(), paneLength);

        $elements.each(function(index, $element) {
           
            $element = $($element);

            if (orderN > 0) { orderN += 1; }
            
            const paneShell = $(`<div class="${style["e-pane"]} ${style["e-pane-horizontal"]}"></div>`);

            const paneStyle = {"order": orderN + ""};

            if (index + 1 !== $elements.length) {
                // paneStyle['flex-basis'] = `${initialFlexBasis}%`;
                paneShell.addClass(style["e-static-pane"]);
            }

            paneShell.css(paneStyle);

            $element.appendTo(paneShell);

            orderN += 1;

            $items.push(paneShell);
            
            const $handle = $(`<div 
                class="${style.splitbar} ${isVertical ? style.vertical : style.horizontal}" 
                style="order: ${orderN}" 
                tabindex="0" 
                role="separator" 
                aria-orientation="${orientation}">
                <div class="${isVertical ? style.handle_v : style.handle_h}"></div>
            </div>`);

            if (index + 1 !== $elements.length) {
               
                $handle.insertAfter($element); 
        
                $handles.push($handle);
                $items.push($handle);

                
            } 
        });

        $items.forEach(i => $(i).appendTo(innerContainer));

        // const containerOffset = isVertical ? innerContainer.offset().top : innerContainer.offset().left;

        $handles.forEach(function(item, idx) {
            const leftSide = item.prev();
            const rightSide = item.next();

            let coords;

            item.on("mousedown", mouseDownHandler);

            function mouseDownHandler(e) {
                const { left, top } = item.offset();

                // leftSide.width() doesnt return correct width i.e 48px instead of 0px

                coords = {
                    e,
                    offsetLeft: left,
                    offsetTop: top,
                    firstWidth: leftSide[0].getBoundingClientRect().width,
                    secondWidth: rightSide[0].getBoundingClientRect().width,
                    secondLeft: parseInt(rightSide.css("left")),
                    secondTop: parseInt(rightSide.css("top")),
                    firstHeight: leftSide[0].getBoundingClientRect().height,
                    secondHeight: rightSide[0].getBoundingClientRect().height
                };

                containerValue = innerContainer.width();

                if (isVertical) {
                    containerValue = innerContainer.height();
                }
              
                document.addEventListener("mousemove", mouseMoveHandler);
                document.addEventListener("mouseup", mouseUpHandler);
            }

            function mouseMoveHandler(e) {
                const delta = {
                    x: e.clientX - coords.e.clientX,
                    y: e.clientY - coords.e.clientY
                };

                if (isVertical) {
                    // TODO

                    delta.x = Math.min(Math.max(delta.y, -coords.firstHeight), coords.secondHeight);

                    leftSide.css({"flex-basis": ((coords.firstHeight + delta.x )* 100) / containerValue + "%"});

                    if (idx !== $handles.length - 1) {
               
                        rightSide.css({
                            "flex-basis": ((coords.secondHeight - delta.x) * 100) / containerValue + "%"
                        });
                    }

                } else {
                    delta.x = Math.min(Math.max(delta.x, -coords.firstWidth), coords.secondWidth);
                
                    leftSide.css({"flex-basis": ((coords.firstWidth + delta.x )* 100) / containerValue + "%"});

                    if (idx !== $handles.length - 1) {
                        rightSide.css({
                            "flex-basis": ((coords.secondWidth - delta.x) * 100) / containerValue + "%"
                        });
                    }
                }

                              
            }

            function mouseUpHandler() {
                document.removeEventListener("mousemove", mouseMoveHandler);
                document.removeEventListener("mouseup", mouseUpHandler);
            }
        });

    }
}

// export class Splitter extends ItemView {
//     static options = {
//         // panes: {type: types.primitives.Array, default:[]},
//         orientation: {type: types.primitives.String, default: "horizontal"},
//     };

//     constructor(options) {
//         const $container = options.$container;
//         // $container.css({position: "relative"});

//         super(options);

//         const $elements = $container.children();

//         const isVertical = this._options.orientation === "vertical";

//         if ($elements.length < 2) {
//             throw new Error("Container must contain at least two elements.");
//         }

//         $container.empty();

//         const innerContainer = $('<div style="position: relative; width: inherit; height: inherit;"></div>');

//         $elements.each(function() { $(this).appendTo(innerContainer); });

//         innerContainer.appendTo($container);
        
//         const $handles = [];

//         $elements.each(function(index, $element) {
//             const css = {
//                 position: "absolute",
//                 top: 0,
//                 left: 0,
//                 // "min-height": "100%",
//                 overflow: "auto"
//             };

//             $element = $($element);

     
//             if (isVertical) {
//                 css.top = index > 0 ? parseInt($element.prev().css("top")) + 8 : 0;
//                 css.width = "100%";
//                 css.height = $element.height();
//             } else {
//                 css.left = index > 0 ? parseInt($element.prev().css("left")) + 8 : 0;
//                 //css.width = $element.width();
//             }
            

//             $element.css(css);
            
//             const $handle = $(`<div class="${style.splitbar} ${isVertical ? style.vertical : style.horizontal}">
//                 <div class="${isVertical ? style.handle_v : style.handle_h}"></div>
//             </div>`);

//             if (index + 1 !== $elements.length) {
//                 $handle.insertAfter($element);
//                 if (isVertical) {
//                     $handle.css({top: css.top + $element.height()});
//                 } else {
//                     $handle.css({left: css.left + $element.width()});
//                 }
//                 $handles.push($handle);
//             }
//         });

//         const containerOffset = isVertical ? innerContainer.offset().top : innerContainer.offset().left;

//         $handles.forEach(function(item) {
//             const leftSide = item.prev();
//             const rightSide = item.next();

//             let coords;

//             item.on("mousedown", mouseDownHandler);

//             function mouseDownHandler(e) {
//                 const { left, top } = item.offset();

//                 coords = {
//                     e,
//                     offsetLeft: left,
//                     offsetTop: top,
//                     firstWidth: leftSide.width(),
//                     secondWidth: rightSide.width(),
//                     secondLeft: parseInt(rightSide.css("left")),
//                     secondTop: parseInt(rightSide.css("top")),
//                     firstHeight: leftSide.height(),
//                     secondHeight: rightSide.height()
//                 };
              
//                 document.addEventListener("mousemove", mouseMoveHandler);
//                 document.addEventListener("mouseup", mouseUpHandler);
//             }

//             function mouseMoveHandler(e) {
//                 const delta = {
//                     x: e.clientX - coords.e.clientX,
//                     y: e.clientY - coords.e.clientY
//                 };

//                 if (isVertical) {
//                     delta.x = Math.min(Math.max(delta.y, -coords.firstHeight), coords.secondHeight);

//                     item.css({top: (coords.offsetTop + delta.x - containerOffset) + "px"});

//                     leftSide.height((coords.firstHeight + delta.x) + "px");
                                        
//                     rightSide.css({
//                         top: coords.secondTop + delta.x + "px",
//                         height: (coords.secondHeight - delta.x) + "px"
//                     });
//                 } else {
//                     delta.x = Math.min(Math.max(delta.x, -coords.firstWidth), coords.secondWidth);
            
//                     item.css({left: (coords.offsetLeft + delta.x - containerOffset) + "px"});
    
//                     leftSide.width((coords.firstWidth + delta.x) + "px");
    
//                     rightSide.css({
//                         left: coords.secondLeft + delta.x + "px",
//                         width: (coords.secondWidth - delta.x) + "px"
//                     });
//                 }

                              
//             }

//             function mouseUpHandler() {
//                 document.removeEventListener("mousemove", mouseMoveHandler);
//                 document.removeEventListener("mouseup", mouseUpHandler);
//             }
//         });

//     }
// }