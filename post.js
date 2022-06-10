const Post = function() {
  return {
    init: function() {
      this.feed = {};
      this.fromPost = 0;
      this.untilPost = 2;
      this.imageDir = "images/";
      this.largeSuffix = "-large.png";
      this.thumbnailSuffix = "-thumbnail.png";

      this.createFeed();
      this.createPostForm();
      this.createHighlight();
      this.createOverlay();
    },
    addPost: async function() {
      // Add new post to feed

      // Set spinner instead of submit button
      this.postFormButton.remove();
      this.postFormSubmit.append(this.postFormSpinner);

      let interval = setInterval(() => {
        if ((this.postFormSpinner.innerHTML += ".").length == 13) {
          this.postFormSpinner.innerHTML = "Uploading";
        }
      }, 300);

      // Create new post
      let newPost = await this.putPost(this);

      // Add post to html page
      this.feedDiv.prepend(this.createPost(newPost));

      // Hide form
      this.toggleElement(this.formDiv);

      // Sidy up spinner and add button back
      this.postFormSpinner.remove();
      clearInterval(interval);

      this.postFormSubmit.append(this.postFormButton);
    },
    putPost: async function(self) {
      // Send put request to api to create new post artifacts

      var data = new FormData()
      data.append('image', self.postFormImage.files[0]) 
      data.append('caption', self.postFormCaption.value)

      try {
        // Response contains fetch promise
        let response = await fetch(
          'post.cgi', {method: 'PUT', body: data });
        return await response.json();
      }
      catch(error) {
        alert('Creating new post failed');
        console.error(error);
      }
    },
    getFeed: async function() {
       try {
        let response = await fetch('feed.json');
        return await response.json();
      }
      catch(error) {
        console.error(error);
      }
    },
    createPost: function(post) {
      let postFig = document.createElement("figure");

      let postImg = document.createElement("img");
      postImg.setAttribute("src", this.imageDir + post.id + this.thumbnailSuffix);

      let postCaption = document.createElement("figcaption");
      postCaption.innerHTML = post.caption;

      postFig.addEventListener("click", () => this.highlightPost(this.imageDir + post.id + this.largeSuffix, post.caption));

      postFig.append(postImg);
      postFig.append(postCaption);

      return postFig;
    },
    generateFeedPosts: function(feedDiv, fromPost, untilPost) {
      // Add given number of posts
      let counter = 0;
      for (var i = 0; i < this.feed.feed.length; i++) {
        if (counter >= fromPost && counter < untilPost) {
          feedDiv.append(this.createPost(this.feed.feed[i]));
        }
        counter += 1;
      }
    },
    createFeed: async function(parentElement=document.body) {
      this.feed = await this.getFeed();

      this.feedDiv = document.createElement("div");
      this.feedDiv.setAttribute("style", "width: 400px; margin: 1em auto;");

      this.generateFeedPosts(this.feedDiv, this.fromPost, this.untilPost);

      this.newPostButton = document.createElement("input");
      this.newPostButton.setAttribute("type", "button");
      this.newPostButton.setAttribute("value", "New post");
      this.newPostButton.addEventListener("click", () => this.newForm());

      parentElement.append(this.newPostButton);
      parentElement.append(this.feedDiv);

    },
    newForm: function() {
      this.postFormCaption.value = "";
      this.postFormImage.value = "";
      this.toggleElement(this.formDiv);
    },
    createOverlay: function(parentElement=document.body) {
      this.overlayDiv = document.createElement('div');
      this.overlayDiv.setAttribute("style", "position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: black; opacity: .7; z-index: 1; display: none;");

      this.overlayClose = document.createElement("span");
      this.overlayClose.innerHTML = "&#215;";
      this.overlayClose.setAttribute("style", "float: right; margin: .3em; font-size: 2em; font-weight: bold; color: white; cursor: pointer;");

      //this.overlayClose.addEventListener("click", () => this.closeOverlay());
      this.overlayDiv.addEventListener("click", () => this.closeOverlay());

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          //if esc key was not pressed in combination with ctrl or alt or shift
          const isNotCombinedKey = !(event.ctrlKey || event.altKey || event.shiftKey);
          if (isNotCombinedKey) {
            this.closeOverlay();
          }
        }
      });

      this.overlayDiv.append(this.overlayClose);
      document.body.append(this.overlayDiv);
    },
    createPostForm: function(parentElement=document.body) {
      this.postFormImage = document.createElement("input");
      this.postFormImage.setAttribute("type", "file");
      this.postFormImage.setAttribute("name", "image");
      this.postFormImage.setAttribute("accept", ".jpg, .png, .jpeg, .gif");

      this.postFormCaption = document.createElement("input");
      this.postFormCaption.setAttribute("type", "text");
      this.postFormCaption.setAttribute("name", "caption");

      this.postFormButton = document.createElement("input");
      this.postFormButton.setAttribute("type", "button");
      this.postFormButton.setAttribute("value", "New post");
      this.postFormButton.addEventListener("click", () => this.addPost());

      this.postFormSpinner = document.createElement("span");
      this.postFormSpinner.innerHTML = 'Uploading';

      this.postFormSubmit = document.createElement("div");

      this.formDiv = document.createElement('div');
      this.formDiv.setAttribute("style", "position: absolute; top: 50%; left: 50%; width: 300px; margin-left: -150px; height: 300px; margin-top: -150px; background: yellow; z-index: 2; display: none;");

      this.postFormSubmit.append(this.postFormButton);

      this.formDiv.append(this.postFormCaption);
      this.formDiv.append(this.postFormImage);
      this.formDiv.append(this.postFormSubmit);

      parentElement.append(this.formDiv);
    },
    createHighlight: function(parentElement=document.body) {
      this.highlightDiv = document.createElement("div");
      this.highlightFig = document.createElement("figure");
      this.highlightCaption = document.createElement("figcaption");
      this.highlightImg = document.createElement("img");

      this.highlightFig.append(this.highlightImg);
      this.highlightFig.append(this.highlightCaption);
      this.highlightDiv.append(this.highlightFig);

      this.highlightDiv.setAttribute("style", "display: none; position: absolute; top: 2em; left: 50%; width: 100px; margin-left: -50px; z-index: 2;");

      parentElement.append(this.highlightDiv);
    },
    highlightPost: function(imgSrc, caption) {
      // NB "this" is the click event, ie figure element, not this object

      this.highlightImg.src = imgSrc;
      this.highlightCaption.innerHTML = caption;

      this.toggleElement(this.highlightDiv);
    },
    closeOverlay: function() {
      // Close overlay and all the stuff it may have open
        this.overlayDiv.style.display = "none";
        this.formDiv.style.display = "none";
        this.highlightDiv.style.display = "none";
    },
    toggleElement: function(element) {
      if (element.style.display === "none") {
        this.overlayDiv.style.display = "block";
        element.style.display = "block";
      }
      else {
        this.overlayDiv.style.display = "none";
        element.style.display = "none";
      }
    }
  } // /return
}
