const Post = function() {
  return {
    init: function() {
      this.feed = {};
      this.fromPost = 0;
      this.untilPost = 3;
      this.imageDir = "images/";
      this.largeSuffix = "-large.png";
      this.thumbnailSuffix = "-thumbnail.png";

      this.createFeed();
      this.createPostForm();
      this.createOverlay();
    },
    deletePost: async function() {
      if (confirm("Really delete this post?") == false) {
        return false;
      }

      console.log("Deleting " + this.postFormId.value);

      // Set spinner instead of submit button
      this.postFormDeleteButton.style.display = "none";
      this.postFormUpdateButton.style.display = "none";
      this.postFormSubmit.append(this.postFormSpinner);

      this.postFormSpinner.innerHTML = "Deleting";
      let interval = setInterval(() => {
        if ((this.postFormSpinner.innerHTML += ".").length == 12) {
          this.postFormSpinner.innerHTML = "Deleting";
        }
      }, 300);

      await this.deletePostRequest(this.postFormId.value);

      // Remove post from feed
      let post = document.getElementById(this.postFormId.value);
      post.remove();

      // Hide form
      this.closeForm();

      // Tidy up spinner and add button back
      this.postFormSpinner.remove();
      clearInterval(interval);


    },
    addPost: async function() {
      // Add new post to feed

      // Set spinner instead of submit button
      this.postFormNewButton.remove();
      this.postFormSubmit.append(this.postFormSpinner);

      let interval = setInterval(() => {
        if ((this.postFormSpinner.innerHTML += ".").length == 13) {
          this.postFormSpinner.innerHTML = "Uploading";
        }
      }, 300);

      // Create new post
      let newPost = await this.putPostRequest(this);

      // Add post to html page
      this.feedDiv.prepend(this.createPost(newPost));

      // Hide form
      this.closeForm();

      // Tidy up spinner and add button back
      this.postFormSpinner.remove();
      clearInterval(interval);

      this.postFormSubmit.append(this.postFormNewButton);
    },
    putPostRequest: async function(self) {
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
    deletePostRequest: async function(id) {
      // Send delete request to api to create delete post

      var data = new FormData()
      data.append('id', id)

      try {
        // Response contains fetch promise
        let response = await fetch(
          'post.cgi', {method: 'DELETE', body: data });
        return await response;
      }
      catch(error) {
        alert('Deleting post failed');
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
      let postFigDiv = document.createElement("div");
      postFigDiv.setAttribute("id", post.id);

      let postFig = document.createElement("figure");

      let postImg = document.createElement("img");
      postImg.setAttribute("src", this.imageDir + post.id + this.thumbnailSuffix);

      let postCaption = document.createElement("figcaption");
      postCaption.innerHTML = post.caption;

      let postFigEdit = document.createElement("a");
      postFigEdit.innerHTML = "✏️";

      postFigEdit.addEventListener("click", () => {
        this.postFormImageLabel.innerHTML = "Replace image";
        this.postFormId.value = post.id;
        this.postFormCaption.value = post.caption;
        this.postFormImage.value = "";
        this.postFormNewButton.style.display = "none";
        this.postFormUpdateButton.style.display = "block";
        this.postFormDeleteButton.style.display = "block";
        this.showForm();
      })


      let postFigOriginalImageLink = document.createElement("a");
      postFigOriginalImageLink.innerHTML = "🖼️";
      postFigOriginalImageLink.setAttribute("href", this.imageDir + post.id + "-original." + post.originalExtension);
      postFigOriginalImageLink.setAttribute("target", "_blank");

      postFigDiv.append(postFig);
      postFigDiv.append(postFigEdit);
      postFigDiv.append(postFigOriginalImageLink);
      postFig.append(postImg);
      postFig.append(postCaption);

      return postFigDiv;
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
      this.feedDiv.setAttribute("id", "feed");

      this.generateFeedPosts(this.feedDiv, this.fromPost, this.untilPost);

      this.newPostPlus = document.createElement("div");
      this.newPostPlus.setAttribute("id", "new-post-plus");
      this.newPostPlus.innerHTML = "+";
      this.newPostPlus.addEventListener("click", () => this.newForm());

      parentElement.append(this.newPostPlus);
      parentElement.append(this.feedDiv);

    },
    newForm: function() {
      this.postFormId.value = "";
      this.postFormCaption.value = "";
      this.postFormImage.value = "";
      this.postFormImageLabel.innerHTML = "Image";
      this.postFormNewButton.style.display = "block";
      this.postFormUpdateButton.style.display = "none";
      this.postFormDeleteButton.style.display = "none";
      this.showForm();
    },
    createOverlay: function(parentElement=document.body) {
      this.overlayDiv = document.createElement('div');
      this.overlayDiv.setAttribute("id", "overlay");

      this.overlayClose = document.createElement("span");
      this.overlayClose.innerHTML = "+";
      this.overlayClose.setAttribute("id", "overlay-close");

      this.overlayDiv.addEventListener("click", () => this.closeForm());

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          //if esc key was not pressed in combination with ctrl or alt or shift
          const isNotCombinedKey = !(event.ctrlKey || event.altKey || event.shiftKey);
          if (isNotCombinedKey) {
            this.closeForm();
          }
        }
      });

      this.overlayDiv.append(this.overlayClose);
      document.body.append(this.overlayDiv);
    },
    createPostForm: function(parentElement=document.body) {
      this.postFormImage = document.createElement("input");
      this.postFormImage.setAttribute("type", "file");
      this.postFormImage.setAttribute("id", "image");
      this.postFormImage.setAttribute("name", "image");
      this.postFormImage.setAttribute("accept", ".jpg, .png, .jpeg, .gif");

      this.postFormImageLabel = document.createElement("label");
      this.postFormImageLabel.setAttribute("for", "image");
      this.postFormImageLabel.innerHTML = "Photo";

      //this.postFormCaption = document.createElement("input");
      //this.postFormCaption.setAttribute("type", "text");
      this.postFormCaption = document.createElement("textarea");
      this.postFormCaption.setAttribute("name", "caption");
      this.postFormCaption.setAttribute("id", "caption");

      this.postFormCaptionLabel = document.createElement("label");
      this.postFormCaptionLabel.setAttribute("for", "caption");
      this.postFormCaptionLabel.innerHTML = "Caption";

      this.postFormId = document.createElement("input");
      this.postFormId.setAttribute("type", "hidden");
      this.postFormId.setAttribute("name", "id");

      this.postFormNewButton = document.createElement("input");
      this.postFormNewButton.setAttribute("type", "button");
      this.postFormNewButton.setAttribute("value", "Create");
      this.postFormNewButton.addEventListener("click", () => this.addPost());

      this.postFormUpdateButton = document.createElement("input");
      this.postFormUpdateButton.setAttribute("type", "button");
      this.postFormUpdateButton.setAttribute("value", "Update");
      this.postFormUpdateButton.addEventListener("click", () => this.updatePost());

      this.postFormDeleteButton = document.createElement("input");
      this.postFormDeleteButton.setAttribute("type", "button");
      this.postFormDeleteButton.setAttribute("value", "Delete");
      this.postFormDeleteButton.setAttribute("class", "warning");
      this.postFormDeleteButton.addEventListener("click", () => this.deletePost());

      this.postFormSpinner = document.createElement("span");
      this.postFormSpinner.setAttribute("id", "spinner");
      this.postFormSpinner.innerHTML = 'Uploading';

      this.postFormSubmit = document.createElement("div");

      this.formDiv = document.createElement('div');
      this.formDiv.setAttribute("id", "form");

      this.postFormSubmit.append(this.postFormNewButton);
      this.postFormSubmit.append(this.postFormUpdateButton);
      this.postFormSubmit.append(this.postFormDeleteButton);

      this.formDiv.append(this.postFormImageLabel);
      this.formDiv.append(this.postFormImage);
      this.formDiv.append(this.postFormCaptionLabel);
      this.formDiv.append(this.postFormCaption);
      this.formDiv.append(this.postFormSubmit);
      this.formDiv.append(this.postFormId);

      parentElement.append(this.formDiv);
    },
    closeForm: function() {
      this.overlayDiv.style.display = "none";
      this.formDiv.style.display = "none";
      this.newPostPlus.style.display = "block";
    },
    showForm: function() {
      this.overlayDiv.style.display = "block";
      this.formDiv.style.display = "block";
      this.newPostPlus.style.display = "none";
    },

  } // /return
}
