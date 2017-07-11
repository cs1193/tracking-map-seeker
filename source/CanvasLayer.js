/* @flow */

type CanvasLayerOptions = {
  animate: boolean,
  map: object,
  paneName: string,
  resizeHandler: function,
  resolutionScale: number,
  updateHandler: function
};

export default class CanvasLayer {
  static DEFAULT_PANE_NAME: string = 'overlayLayer';

  constructor ({
    animate,
    map,
    paneName,
    resizeHandler,
    resolutionScale,
    updateHandler
  }: CanvasLayerOptions) {
    this.isAdded: boolean = false;
    this.isAnimated: boolean = false;
    this.paneName: string = CanvasLayer.DEFAULT_PANE_NAME;
    this.updateHandler = null;
    this.resizeHandler = null;
    this.topLeft = null;
    this.centerListener = null;
    this.resizeListener = null;
    this.needsResize = true;
    this.requestAnimationFrameId = null;

    let canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.pointerEvents = 'none';

    this.canvas = canvas;


  }
}
