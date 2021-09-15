import Post from '../../models/post';
import mongoose from 'mongoose';
import Joi from 'Joi';

const { ObjectId } = mongoose.Types;

export const getPostById = async (ctx, next) => {
  const { id } = ctx.params;
  if (!ObjectId.isValid(id)) {
    ctx.status = 400;
    return;
  }
  try {
    const post = await Post.findById(id);
    if (!post) {
      ctx.status = 404;
      return;
    }
    ctx.state.post = post;
    return next();
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const checkOwnPost = (ctx, next) => {
  const { user, post } = ctx.state;
  if (post.user._id.toString() !== user._id) {
    ctx.status = 403;
    return;
  }
  return next();
};

/*
    POST /api/posts
    @title, body, tags[]
*/
export const write = async (ctx) => {
  const schema = Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
  });

  const result = schema.validate(ctx.request.body);
  if(result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { title, body, tags } = ctx.request.body;
  const post = new Post({
    title,
    body,
    tags,
    user: ctx.state.user,
  });

  try {
    await post.save();
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
    GET /api/posts
*/
export const list = async (ctx) => {
  const page = parseInt(ctx.query.page || '1', 10);

  if(page < 1) {
    ctx.status = 400;
    return;
  }

  try {
    const posts = await Post.find()
      .sort({ _id: -1 })
      .limit(10)
      .skip((page - 1) * 10) //n개를 제외하고 다음 데이터
      .lean() //Json
      .exec();
    const postCount = await Post.countDocuments().exec();
    ctx.set('Last-Page', Math.ceil(postCount / 10));
    ctx.body = posts.map(post => ({
        ...post,
        body:
          post.body.length < 200 ? post.body : `${post.body.slice(1, 200)}...`,
      }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

/* 
    GET /api/posts/:id
*/
export const read = async (ctx) => {
  ctx.body = ctx.state.post;
};

/*
    DELETE /api/posts/:id
*/
export const remove = async (ctx) => {
  const { id } = ctx.params;

  try {
    await Post.findOneAndRemove(id).exec();
    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
    PATCH /api/posts/:id
    @title, body, tags[]
*/
export const update = async (ctx) => {
  const { id } = ctx.params;

  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  });

  const result = schema.validate(ctx.request.body);
  if(result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  try {
    const post = await Post.findByIdAndUpdate(id, ctx.request.body, {
      new: true, //업데이트된 데이터 반환, fasle : 업데이트 되기 전 데이터 반환
    }).exec();

    if (!post) {
      ctx.status = 404;
      return;
    }

    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};
