const Post = function() {
  return {
    init: function() {
      this.feed = {};
      this.fromPost = 0;
      this.untilPost = 2;

      this.createFeed();
      this.createPostForm();
    },
    addPost: async function() {
      // Add new post to feed

      // Create new post
      let newPost = await this.putPost(this);

      console.log(newPost);
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
      postImg.setAttribute("src", post.id + '-thumbnail.png');

      let postCaption = document.createElement("figcaption");
      postCaption.innerHTML = post.caption;

      postFig.append(postImg);
      postFig.append(postCaption);

      return postFig;
    },
    generateFeedPosts: function(feedDiv, fromPost, untilPost) {
      // Add given number of posts
console.log(feedDiv);
      let counter = 0;
      for (var postKey in this.feed) {
        if (counter >= fromPost && counter < untilPost) {
          feedDiv.append(this.createPost(this.feed[postKey]));
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
      this.toggleForm();
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

      this.postFormClose = document.createElement("span");
      this.postFormClose.innerHTML = "&#x2716;";
      this.postFormClose.setAttribute("style", "float: right; margin: .3em; color: white; cursor: pointer;");
      this.postFormClose.addEventListener("click", () => this.toggleForm());

      this.overlayDiv = document.createElement('div');
      this.overlayDiv.setAttribute("style", "position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: black; opacity: .7; z-index: 1; display: none;");

      this.formDiv = document.createElement('div');
      this.formDiv.setAttribute("style", "position: absolute; top: 50%; left: 50%; width: 300px; margin-left: -150px; height: 300px; margin-top: -150px; background: black; z-index: 2; display: none;");
      this.formDiv.append(this.postFormClose);
      this.formDiv.append(this.postFormCaption);
      this.formDiv.append(this.postFormImage);
      this.formDiv.append(this.postFormButton);

      parentElement.append(this.formDiv);
      parentElement.append(this.overlayDiv);
    },
    toggleForm: function() {
      if (this.overlayDiv.style.display === "none") {
        this.overlayDiv.style.display = "block";
        this.formDiv.style.display = "block";
      }
      else {
        this.overlayDiv.style.display = "none";
        this.formDiv.style.display = "none";
      }
    }
  } // /return
}
