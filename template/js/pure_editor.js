// Generated by CoffeeScript 1.6.2
(function() {
  var EditorModel, Post, controls_width, cookie_tmp_doc, make_textarea_center, posts_host, sync_gateway,
    _this = this;

  posts_host = '/recent_posts_data';

  sync_gateway = '/service/gateway/sync';

  controls_width = 235;

  cookie_tmp_doc = function(path, content) {
    var base64_content, end, i, key, parts, per, start, _i, _ref;

    path = $.trim(path);
    content = $.trim(content);
    if (!path || !content) {
      return false;
    }
    base64_content = $.base64.btoa(content, true);
    per = 3600;
    parts = Math.ceil(base64_content.length / per);
    if (parts > 10) {
      return false;
    } else {
      $.cookie('sync_tmp_path', path, {
        expires: 7,
        path: '/'
      });
    }
    for (i = _i = 0, _ref = parts - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      key = 'sync_tmp_content_' + i;
      start = i * per;
      end = (i + 1) * per;
      $.cookie(key, base64_content.slice(start, end), {
        expires: 7,
        path: '/'
      });
    }
    return true;
  };

  Post = function(raw_post, editor) {
    var raw_content, title_reg,
      _this = this;

    this.path = raw_post.path;
    this.title = ko.observable(raw_post.title);
    raw_content = raw_post['_content'] || '';
    title_reg = new RegExp('(?:^|([\r\n]))Title: ?' + raw_post.title + ' *[\r\n]', 'i');
    this.content = raw_content.replace(title_reg, '$1');
    this.edit = function() {
      var current_post_dom, index, t_dom;

      t_dom = $('#textarea');
      if (editor.current_post()) {
        editor.current_post()['content'] = t_dom.val();
        editor._sync(editor.get_path(), editor.get_content());
      }
      t_dom.val(_this.content);
      t_dom.focus();
      $('#posts li a.current').removeClass('current');
      index = $.inArray(_this, editor.posts());
      current_post_dom = $($('#posts li a')[index]);
      current_post_dom.addClass('current');
      return editor.current_post(_this);
    };
    this.remove = function() {
      var current;

      $.post(sync_gateway, {
        'path': _this.path,
        'is_deleted': true
      });
      editor.posts.remove(_this);
      if (editor.posts().length) {
        if (_this.path === editor.get_path()) {
          current = editor.posts()[0];
          return current.edit();
        }
      } else {
        return editor.create_post();
      }
    };
    return this;
  };

  EditorModel = function() {
    var controls, self,
      _this = this;

    self = this;
    controls = $('#controls');
    this.posts = ko.observableArray([]);
    this.current_post = ko.observable({});
    this.current_title = ko.observable('');
    this.load_posts = function() {
      return $.getJSON(posts_host, {}, function(posts) {
        var post, _i, _len;

        for (_i = 0, _len = posts.length; _i < _len; _i++) {
          post = posts[_i];
          _this.posts.push(new Post(post, self));
        }
        if (_this.posts().length) {
          return _this.posts()[0].edit();
        } else {
          return _this.create_post();
        }
      });
    };
    this.create_post = function() {
      var i, new_post, path, paths, title, _i;

      paths = $.map(_this.posts(), function(post) {
        return post.path;
      });
      for (i = _i = 0; _i <= 5; i = ++_i) {
        title = $.format.date(new Date(), 'yyyy-MM-dd');
        if (i) {
          title = title + '-' + i;
        }
        path = title + '.txt';
        if ($.inArray(path, paths) === -1) {
          break;
        }
        if (i === 5) {
          return;
        }
      }
      new_post = new Post({
        path: path,
        title: title
      }, self);
      _this.posts.unshift(new_post);
      return new_post.edit();
    };
    this.show_controls = function() {
      if (controls.position().left === -controls_width) {
        controls.animate({
          left: 0,
          opacity: 1
        }, 350, 'swing', make_textarea_center);
      }
      if ($.browser.msie) {
        return $('#textarea').blur();
      }
    };
    this.hide_controls = function() {
      if (controls.position().left === 0) {
        controls.animate({
          left: -controls_width,
          opacity: 0.3
        }, 500, 'swing', make_textarea_center);
      }
      return $('#textarea').focus();
    };
    controls.mouseenter(this.show_controls);
    this.get_content = function() {
      var content, raw_content, title, title_value;

      title = $.trim($('#title').val());
      title_value = 'Title: ' + title + '\n';
      raw_content = $.trim($('#textarea').val());
      if (raw_content.match(/^\s*---\s*[\r\n]/)) {
        content = raw_content.replace(/^\s*---\s*[\r\n]/, '---\n' + title_value);
      } else {
        content = title_value + raw_content;
      }
      return content;
    };
    this.get_path = function() {
      return _this.current_post().path;
    };
    this.sync_per_seconds = 30;
    this.sync = function() {
      if (!_this.keep_sync_set) {
        _this.keep_sync_set = true;
        setInterval(_this.keep_sync, 10 * 1000);
      }
      if (!_this.last_sync_at) {
        _this.last_sync_at = new Date();
        _this.need_sync = true;
      } else if (new Date() - _this.last_sync_at < _this.sync_per_seconds * 1000) {
        _this.need_sync = true;
        return false;
      } else {
        _this.need_sync = false;
        _this.last_sync_at = new Date();
      }
      return _this._sync();
    };
    this._sync = function(path, content) {
      var data;

      if (!_this.need_sync) {
        return;
      }
      path = path || _this.get_path();
      content = content || _this.get_content();
      data = {
        path: path,
        raw_content: content
      };
      return $.post(sync_gateway, data);
    };
    this.keep_sync = function() {
      if (!_this.need_sync) {

      } else {
        return _this.sync();
      }
    };
    this.insert_image_allowed = function() {
      var dom;

      dom = $('#textarea');
      $(dom)[0].addEventListener('drop', function(event) {
        var file, files, reader, _i, _len;

        files = event.dataTransfer.files;
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          file = files[_i];
          if (file.type.indexOf('image') === -1) {
            continue;
          }
          reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = function(ev) {
            return _this.upload_image(ev.target.result);
          };
        }
        return event.preventDefault();
      }, false);
      return $(dom)[0].addEventListener('dragover', function(event) {
        return event.preventDefault();
      }, false);
    };
    this.canvas = document.createElement('canvas');
    this.cx = this.canvas.getContext('2d');
    this.upload_image = function(file) {
      var img;

      img = new Image();
      img.src = file;
      return $(img).one('load', function() {
        var cursorPos, dom, h, height, height_r, image_path, max_r, old_value, request_data, text_after, text_before, thumb_height, thumb_width, to_insert, w, width, width_r;

        width = this.naturalWidth || this.width;
        height = this.naturalHeight || this.height;
        thumb_height = 2560;
        thumb_width = 1280;
        width_r = width / thumb_width;
        height_r = height / thumb_height;
        max_r = Math.max(width_r, height_r);
        w = max_r > 1 ? width / max_r : width;
        h = max_r > 1 ? height / max_r : height;
        self.canvas.width = w;
        self.canvas.height = h;
        self.cx.drawImage(this, 0, 0, w, h);
        image_path = '/_image' + $.format.date(new Date(), '/yyyy-MM-dd/HH-mm-ss') + '.jpg';
        request_data = {
          path: image_path,
          base64: self.canvas.toDataURL('image/jpeg', 0.96)
        };
        $.post(sync_gateway, request_data);
        to_insert = '![Image](' + image_path + ')\n';
        dom = $('#textarea');
        cursorPos = dom.prop('selectionStart');
        old_value = dom.val();
        text_before = old_value.substring(0, cursorPos);
        text_after = old_value.substring(cursorPos, old_value.length);
        dom.val(text_before + to_insert + text_after);
        return dom.focus();
      });
    };
    return this;
  };

  make_textarea_center = function() {
    var controls, dom, padding, textarea_width, title_dom;

    dom = $('#textarea');
    title_dom = $('#title');
    textarea_width = 780;
    padding = ($(document).width() - textarea_width) / 2;
    controls = $('#controls');
    if (controls.position().left === 0) {
      padding -= controls_width / 2;
    }
    dom.css({
      "padding-right": padding + 'px',
      'width': textarea_width + padding + 'px'
    });
    title_dom.css({
      "right": padding + 'px',
      'width': textarea_width + 'px'
    });
    if ($.browser.mozilla) {
      return dom.css({
        'width': textarea_width + 'px'
      });
    }
  };

  this.run_editor = function() {
    var editor_model;

    editor_model = new EditorModel();
    _this.editor = editor_model;
    window.onresize = make_textarea_center;
    return $(document).ready(function() {
      var text_dom, title_dom,
        _this = this;

      text_dom = $('#textarea');
      title_dom = $('#title');
      make_textarea_center();
      ko.applyBindings(editor_model);
      editor_model.load_posts();
      editor_model.insert_image_allowed();
      text_dom.scroll(function() {
        if (text_dom.scrollTop() > 25) {
          return title_dom.css('display', 'none');
        } else {
          return title_dom.css('display', 'block');
        }
      });
      title_dom.keyup(function(event) {
        editor_model.current_post().title(title_dom.val());
        if (event.which === 13) {
          return text_dom.focus();
        }
      });
      return window.onbeforeunload = function() {
        var cached;

        if (editor_model.need_sync) {
          cached = cookie_tmp_doc(editor_model.get_path(), editor_model.get_content());
          if (!cached) {
            return 'The content is not saved yet, Please wait for a moment!';
          }
        }
        return null;
      };
    });
  };

}).call(this);
