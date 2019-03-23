const Post = require('../models/post');

exports.createPost = (req, res, next) => {
  const url = req.protocol + '://' + req.get('host');
  console.log("url ", url);
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    imagePath: url + '/images/' + req.file.filename,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: req.userData.userId,
    likes: 0
  });
  post.save().then(createdPost => {
    res.status(201).json({
      message: 'Post send succesfully',
      post: {
        id: createdPost._id,
        title: createdPost.title,
        content: createdPost.content,
        imagePath: createdPost.imagePath,
        likes: createdPost.likes
      }
    });
  })
  .catch(error => {
    res.status(500).json({
      message: 'Post creation falied'
    });
  });
}

exports.updatePost = (req, res, next) => {
  let imagePath = req.body.imagePath;
  if (req.file) {
    const url = req.protocol + '://' + req.get('host');
    imagePath = url + '/images/' + req.file.filename;
  }
  const post = new Post({
    _id: req.body.id,
    title: req.body.title,
    content: req.body.content,
    imagePath: imagePath,
    updatedAt: new Date(),
    creator: req.userData.userId
  })
  Post.updateOne({ _id: req.params.id, creator: req.userData.userId }, post).then(
    result => {
      if ( result.n > 0 ) {
      res.status(200).json({message: 'Post Updated!'});
      }
      else {
        res.status(401).json({message: 'Not Authorized!' });
      }
    }
  )
  .catch(err => {
    res.status(500).json({
      message: 'Could not update post!'
    });
  })
}

exports.getPosts = (req, res, next) => {
  const pageSize = +req.query.pageSize;
  const currentPage = req.query.currentPage;
  let str = req.query.search;
  const sort = req.query.sort;
  const order = req.query.order;
  let postQuery;
  if (str) {
    str = new RegExp(str,'i');    // case insensitive
    postQuery = Post.find({
      $or:[
        {title: str},
        {content: str}
      ]
    }).sort({sort:1});
  }
  else {
    postQuery = Post.find().sort({[sort]:[order]});
    console.log("postQuery: ",postQuery);
  }
  let fetchedPosts;
  if (pageSize && currentPage) {
    postQuery
    .skip(pageSize * (currentPage - 1))
    .limit(pageSize);
  }
  postQuery
    .then(documents => {
      fetchedPosts = documents;
      return Post.count();
    }).then(count => {
      res.status(200).json({
        message: 'Posts fetched successfully',
        posts: fetchedPosts,
        maxPosts: count
      });
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching posts falied!'
      });
    });
}

exports.getPost = (req, res, next) => {
  Post.findById(req.params.id)
    .then(post => {
      if(post) {
      res.status(200).json(post);
    } else {
      res.status(404).json({
        message: 'Post not found!',
      });
    }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching post falied!'
      })
    });
}

exports.deletePost = (req, res, next) => {
  Post.deleteOne({ _id: req.params.id, creator: req.userData.userId })
    .then(result => {
      if( result.n > 0 ) {
      res.status(200).json({
        message: 'Post deleted'
      });
    } else {
      res.status(401).json({message: 'Not Authorized!' });
    }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Deleting post falied!'
      })
    });
}
