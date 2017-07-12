export default class CanvasLayer extends google.maps.OverlayView {
  static DEFAULT_PANE_NAME_: string = 'overlayLayer';

  static CSS_TRANSFORM_ = ((() => {
    const div = document.createElement('div');
    const transformProps = [
      'transform',
      'WebkitTransform',
      'MozTransform',
      'OTransform',
      'msTransform'
    ];

    for (const prop of transformProps) {
      if (div.style[prop] !== undefined) {
        return prop;
      }
    }

    return transformProps[0];
  }))();

  constructor(opt_options) {
    super();
    this.isAdded_ = false;
    this.isAnimated_ = false;
    this.paneName_ = CanvasLayer.DEFAULT_PANE_NAME_;
    this.updateHandler_ = null;
    this.resizeHandler_ = null;
    this.topLeft_ = null;
    this.centerListener_ = null;
    this.resizeListener_ = null;
    this.needsResize_ = true;
    this.requestAnimationFrameId_ = null;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.pointerEvents = 'none';

    this.canvas = canvas;
    this.canvasCssWidth_ = 300;
    this.canvasCssHeight_ = 150;
    this.resolutionScale_ = 1;

    function simpleBindShim(thisArg, func) {
      return () => { func.apply(thisArg); };
    }

    this.repositionFunction_ = simpleBindShim(this, this.repositionCanvas_);
    this.resizeFunction_ = simpleBindShim(this, this.resize_);
    this.requestUpdateFunction_ = simpleBindShim(this, this.update_);

    if (opt_options) {
      this.setOptions(opt_options);
    }

    this.requestAnimFrame_ =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      (callback => window.setTimeout(callback, 1000 / 60));

    this.cancelAnimFrame_ =
      window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.oCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      (requestId => {});
  }

  setOptions(options) {
    if (options.animate !== undefined) {
      this.setAnimate(options.animate);
    }

    if (options.paneName !== undefined) {
      this.setPaneName(options.paneName);
    }

    if (options.updateHandler !== undefined) {
      this.setUpdateHandler(options.updateHandler);
    }

    if (options.resizeHandler !== undefined) {
      this.setResizeHandler(options.resizeHandler);
    }

    if (options.resolutionScale !== undefined) {
      this.setResolutionScale(options.resolutionScale);
    }

    if (options.map !== undefined) {
      this.setMap(options.map);
    }
  }

  setAnimate(animate) {
    this.isAnimated_ = !!animate;

    if (this.isAnimated_) {
      this.scheduleUpdate();
    }
  }

  isAnimated() {
    return this.isAnimated_;
  }

  setPaneName(paneName) {
    this.paneName_ = paneName;

    this.setPane_();
  }

  getPaneName() {
    return this.paneName_;
  }

  setPane_() {
    if (!this.isAdded_) {
      return;
    }

    const panes = this.getPanes();
    if (!panes[this.paneName_]) {
      throw new Error(`"${this.paneName_}" is not a valid MapPane name.`);
    }

    panes[this.paneName_].appendChild(this.canvas);
  }

  setResizeHandler(opt_resizeHandler) {
    this.resizeHandler_ = opt_resizeHandler;
  }

  setResolutionScale(scale) {
    if (typeof scale === 'number') {
      this.resolutionScale_ = scale;
      this.resize_();
    }
  }

  setUpdateHandler(opt_updateHandler) {
    this.updateHandler_ = opt_updateHandler;
  }

  onAdd() {
    if (this.isAdded_) {
      return;
    }

    this.isAdded_ = true;
    this.setPane_();

    this.resizeListener_ = google.maps.event.addListener(this.getMap(),
        'resize', this.resizeFunction_);
    this.centerListener_ = google.maps.event.addListener(this.getMap(),
        'center_changed', this.repositionFunction_);

    this.resize_();
    this.repositionCanvas_();
  }

  onRemove() {
    if (!this.isAdded_) {
      return;
    }

    this.isAdded_ = false;
    this.topLeft_ = null;

    // remove canvas and listeners for pan and resize from map
    this.canvas.parentElement.removeChild(this.canvas);
    if (this.centerListener_) {
      google.maps.event.removeListener(this.centerListener_);
      this.centerListener_ = null;
    }
    if (this.resizeListener_) {
      google.maps.event.removeListener(this.resizeListener_);
      this.resizeListener_ = null;
    }

    // cease canvas update callbacks
    if (this.requestAnimationFrameId_) {
      this.cancelAnimFrame_.call(window, this.requestAnimationFrameId_);
      this.requestAnimationFrameId_ = null;
    }
  }

  resize_() {
    if (!this.isAdded_) {
      return;
    }

    const map = this.getMap();
    const mapWidth = map.getDiv().offsetWidth;
    const mapHeight = map.getDiv().offsetHeight;

    const newWidth = mapWidth * this.resolutionScale_;
    const newHeight = mapHeight * this.resolutionScale_;
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;

    // resizing may allocate a new back buffer, so do so conservatively
    if (oldWidth !== newWidth || oldHeight !== newHeight) {
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;

      this.needsResize_ = true;
      this.scheduleUpdate();
    }

    // reset styling if new sizes don't match; resize of data not needed
    if (this.canvasCssWidth_ !== mapWidth ||
        this.canvasCssHeight_ !== mapHeight) {
      this.canvasCssWidth_ = mapWidth;
      this.canvasCssHeight_ = mapHeight;
      this.canvas.style.width = `${mapWidth}px`;
      this.canvas.style.height = `${mapHeight}px`;
    }
  }

  draw() {
    this.repositionCanvas_();
  }

  repositionCanvas_() {

    const map = this.getMap();

    const top = map.getBounds().getNorthEast().lat();
    const center = map.getCenter();
    const scale = 2 ** map.getZoom();
    const left = center.lng() - (this.canvasCssWidth_ * 180) / (256 * scale);
    this.topLeft_ = new google.maps.LatLng(top, left);

    const projection = this.getProjection();
    const divCenter = projection.fromLatLngToDivPixel(center);
    const offsetX = -Math.round(this.canvasCssWidth_ / 2 - divCenter.x);
    const offsetY = -Math.round(this.canvasCssHeight_ / 2 - divCenter.y);
    this.canvas.style[CanvasLayer.CSS_TRANSFORM_] = `translate(${offsetX}px,${offsetY}px)`;

    this.scheduleUpdate();
  }

  update_() {
    this.requestAnimationFrameId_ = null;

    if (!this.isAdded_) {
      return;
    }

    if (this.isAnimated_) {
      this.scheduleUpdate();
    }

    if (this.needsResize_ && this.resizeHandler_) {
      this.needsResize_ = false;
      this.resizeHandler_();
    }

    if (this.updateHandler_) {
      this.updateHandler_();
    }
  }

  getTopLeft() {
    return this.topLeft_;
  }

  scheduleUpdate() {
    if (this.isAdded_ && !this.requestAnimationFrameId_) {
      this.requestAnimationFrameId_ =
          this.requestAnimFrame_.call(window, this.requestUpdateFunction_);
    }
  }
}
