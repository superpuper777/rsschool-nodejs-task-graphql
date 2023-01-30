import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const id = request.params.id;
      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: id,
      });
      if (Object.is(post, null)) {
        reply.notFound("Post doesn't exist");
      }
      return post as PostEntity;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const body = request.body;
      const { userId } = body;
      if (!userId) {
        throw fastify.httpErrors.badRequest();
      }
      return await fastify.db.posts.create(body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const id = request.params.id;

      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: id,
      });
      if (Object.is(post, null)) {
        throw fastify.httpErrors.badRequest();
      }
      const userId = await fastify.db.users.findOne({
        key: 'id',
        equals: post!.userId,
      });
      if (Object.is(userId, null)) {
        reply.notFound("Post doesn't exist");
      }
      return await fastify.db.posts.delete(id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const id = request.params.id;
      const body = request.body;
      const post = (await fastify.db.posts.findOne({
        key: 'id',
        equals: id,
      })) as PostEntity;
      if (Object.is(post, null)) {
        throw fastify.httpErrors.badRequest();
      }
      return await fastify.db.posts.change(id, Object.assign(post, body));
    }
  );
};

export default plugin;
