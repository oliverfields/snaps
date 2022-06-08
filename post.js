const Post = function() {
  var feed = {};

  return {
    addPost: async function() {
      // Add new post to feed

      // Create new post
      let newPost = await this.doPut(this);

      console.log(newPost);
    },
    doPut: async function(self) {
      // Send put request to api to create new post artifacts

      var data = new FormData()
      data.append('image', self.postFormImage.files[0]) 
      data.append('title', self.postFormTitle.value)

      try {
        // Response contains fetch promise
        let response = await fetch(
          '/post.cgi', {method: 'PUT', body: data });
        return await response.json();
      }
      catch(error) {
        console.error(error);
      }
    },
    createPostForm: function(parentElement=document.body) {
      let postFormImage = document.createElement("input");
      postFormImage.setAttribute("type", "file");
      postFormImage.setAttribute("name", "image");
      this.postFormImage = postFormImage;

      let postFormTitle = document.createElement("input");
      postFormTitle.setAttribute("type", "text");
      postFormTitle.setAttribute("name", "title");
      this.postFormTitle = postFormTitle;

      let postFormButton = document.createElement("input");
      postFormButton.setAttribute("type", "button");
      postFormButton.setAttribute("value", "New post");
      postFormButton.addEventListener("click", () => this.addPost());
      this.postFormButton = postFormButton;

      let formDiv = document.createElement('div');
      formDiv.append(this.postFormTitle);
      formDiv.append(this.postFormImage);
      formDiv.append(this.postFormButton);
      parentElement.append(formDiv);
    }
  } // /return
}
