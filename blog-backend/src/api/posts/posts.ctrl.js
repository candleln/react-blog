import Post from "../../models/post";
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

export const checkObjectId = (ctx, next) => {
    const { id } = ctx.params;
    if(!ObjectId.isValid(id)) {
        ctx.status = 400;
        return;
    }
    return next();
};

/*
    POST /api/posts
    @title, body, tags[]
*/
export const write = async ctx => {
    const { title, body, tags } = ctx.request.body;
    const post = new Post({
        title,
        body,
        tags,
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
export const list = async ctx => {
    try {
        const posts = await Post.find().exec();
        ctx.body = posts;
    } catch (e) {
        ctx.throw(500, e);
    }
};

/* 
    GET /api/posts/:id
*/
export const read = async ctx => {
    const { id } = ctx.params;
    
    try {
        const post = await Post.findById(id).exec();
        
        if(!post) {
            ctx.status = 404;
            return;
        }
        
        ctx.body = post;

    } catch (e) {
        ctx.throw(500, e);
    }
};

/*
    DELETE /api/posts/:id
*/
export const remove = async ctx => {
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
export const update = async ctx => {
    const { id } = ctx.params;

    try {
        const post = await Post.findByIdAndUpdate(id, ctx.request.body, {
            new: true, //업데이트된 데이터 반환, fasle : 업데이트 되기 전 데이터 반환
        }).exec();

        if(!post) {
            ctx.status = 404;
            return;
        }
        
        ctx.body = post;

    } catch (e) {
        ctx.throw(500, e);
    }
};