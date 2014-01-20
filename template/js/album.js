// Generated by CoffeeScript 1.6.2
(function() {
  var Viewer, compute_gps, exports,
    _this = this,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exports = this;

  Viewer = function(images) {
    var image, self,
      _this = this;

    self = this;
    this.images = images;
    this.image_paths = (function() {
      var _i, _len, _results;

      _results = [];
      for (_i = 0, _len = images.length; _i < _len; _i++) {
        image = images[_i];
        _results.push(image.path);
      }
      return _results;
    })();
    this.image_doms = $('.fb-image');
    this.image_doms.click(function() {
      var current_index;

      current_index = $.inArray(this, self.image_doms);
      self.current_index(current_index);
      self.current_window('image-viewer');
      return false;
    });
    this.current_window = ko.observable();
    this.current_window.subscribe(function(show_window) {
      return $(document.body).css({
        'overflow': show_window ? 'hidden' : 'auto'
      });
    });
    this.current_index = ko.observable();
    this.current_image = ko.computed(function() {
      if (_this.current_index() != null) {
        location.hash = _this.image_paths[_this.current_index()];
        return _this.images[_this.current_index()];
      }
    });
    this.has_next = ko.computed(function() {
      return (_this.current_index() != null) && _this.current_index() < _this.images.length - 1;
    });
    this.has_pre = ko.computed(function() {
      return (_this.current_index() != null) && _this.current_index() > 0;
    });
    this.exif_list = ko.computed(function() {
      var exif, exif_list, fields, info_name;

      fields = {
        'model': 'Model',
        'fn': 'Fn',
        'exposure': 'Exposure',
        'focal_length': 'Focal',
        'iso': 'ISO'
      };
      exif_list = [];
      if (_this.current_image() && _this.current_image().exif) {
        exif = _this.current_image().exif;
        for (info_name in exif) {
          if (info_name in fields) {
            exif_list.push({
              k: fields[info_name],
              v: exif[info_name]
            });
          }
        }
        return exif_list;
      }
      return [];
    });
    this.next = function() {
      if (_this.has_next()) {
        return self.current_index(_this.current_index() + 1);
      }
    };
    this.pre = function() {
      if (_this.has_pre()) {
        return self.current_index(_this.current_index() - 1);
      }
    };
    this.show_exif = ko.observable(false);
    this.show_full = function() {
      var img_dom;

      img_dom = $('.image-viewer .image img');
      if (img_dom) {
        if (img_dom.css('max-height') === '100%') {
          img_dom.css({
            'max-height': 'none'
          });
          $('.icon-resize-full').removeClass('icon-resize-full').addClass('icon-resize-small');
          $('.image-viewer .wrap').css({
            width: '100%',
            'margin-top': 0
          });
          return $('.image-viewer .body').css({
            'max-height': '100%'
          });
        } else {
          img_dom.css({
            'max-height': '100%'
          });
          $('.icon-resize-small').removeClass('icon-resize-small').addClass('icon-resize-full');
          $('.image-viewer .wrap').css({
            width: '80%',
            'margin-top': '4%'
          });
          return $('.image-viewer .body').css({
            'max-height': '80%'
          });
        }
      }
    };
    return this;
  };

  compute_gps = function(image) {
    var gps, _ref, _ref1;

    if (image && image.exif && image.exif.latitude && image.exif.longitude) {
      gps = {
        lat: image.exif.latitude,
        lng: image.exif.longitude,
        title: image.title
      };
      if ((75 < (_ref = gps.lng) && _ref < 125) && (20 < (_ref1 = gps.lat) && _ref1 < 50)) {
        gps.lat = gps.lat - 0.0020746128999990844;
        gps.lng = gps.lng + 0.0047;
      }
      return gps;
    }
  };

  this.draw_map = function(images) {
    var click_marker, gps, image, index, map, markers, _i, _len;

    markers = [];
    for (_i = 0, _len = images.length; _i < _len; _i++) {
      image = images[_i];
      gps = compute_gps(image);
      if (gps) {
        index = $.inArray(image, images);
        click_marker = function(index) {
          _this.viewer.current_index(index);
          return _this.viewer.current_window('image-viewer');
        };
        gps.click = click_marker.bind({}, index);
        markers.push(gps);
      }
    }
    if (markers.length) {
      $('.map-box').css({
        display: 'inline-block'
      });
      map = new GMaps({
        div: '#map',
        lat: markers[0].lat,
        lng: markers[0].lng
      });
      map.addMarkers(markers);
      return map.fitZoom();
    }
  };

  this.run_viewer = function(images) {
    return $(document).ready(function() {
      var default_hash, show_viewer, viewer;

      viewer = new Viewer(images);
      exports.viewer = viewer;
      default_hash = location.hash.replace('#', '');
      if (__indexOf.call(viewer.image_paths, default_hash) >= 0) {
        viewer.current_index($.inArray(default_hash, viewer.image_paths));
        show_viewer = function() {
          return viewer.current_window('image-viewer');
        };
        setTimeout(show_viewer, 100);
      }
      return ko.applyBindings(viewer);
    });
  };

}).call(this);
