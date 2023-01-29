import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const id = request.params.id;
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: id,
      });
      if (Object.is(user, null)) {
        reply.notFound("User doesn't exist");
      }
      return user as UserEntity;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const body = request.body;
      return await fastify.db.users.create(body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const id = request.params.id;
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: id,
      });
      if (Object.is(user, null)) {
        throw fastify.httpErrors.badRequest();
      }
      const changeSubscription = (
        subscribedUser: UserEntity,
        userId: string
      ) => {
        const subscribedUsers = subscribedUser?.subscribedToUserIds;
        const updatedUsers = subscribedUsers?.filter((u) => u !== userId);
        return Object.assign({}, { subscribedToUserIds: updatedUsers });
      };

      const subscribedUsers = await fastify.db.users.findMany({
        key: 'subscribedToUserIds',
        inArray: id,
      });
      subscribedUsers.map((user) =>
        fastify.db.users.change(user.id, changeSubscription(user, id))
      );

      const posts = await fastify.db.posts.findMany();
      const post = posts.find((p) => p.userId == id);
      if (post) {
        fastify.db.posts.delete(post.id);
      }

      const profiles = await fastify.db.profiles.findMany();
      const profile = profiles.find((p) => p.userId == id);
      if (profile) {
        fastify.db.profiles.delete(profile.id);
      }
      return await fastify.db.users.delete(id);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const id = request.params.id;
      const userId = request.body.userId;
      const user = (await fastify.db.users.findOne({
        key: 'id',
        equals: id,
      })) as UserEntity;
      if (Object.is(user, null)) {
        reply.notFound();
      }
      const changeSubscription = (
        subscribedUser: UserEntity,
        userId: string
      ) => {
        const subscribedUsers = subscribedUser?.subscribedToUserIds;
        const updatedUsers = subscribedUsers?.filter((u) => u !== userId);
        updatedUsers.push(userId);
        return Object.assign({}, { subscribedToUserIds: updatedUsers });
      };

      const subscribedUser = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      }) as UserEntity;
      if (Object.is(subscribedUser, null)) {
        throw await fastify.httpErrors.notFound();
      }
      return await fastify.db.users.change(
        userId,
        changeSubscription(subscribedUser, id)
      );
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const id = request.params.id;
      const userId = request.body.userId;
      const user = (await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      })) as UserEntity;
      const subscribedUser = (await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      })) as UserEntity;
      if (Object.is(subscribedUser, null) || Object.is(user, null)) {
        throw await fastify.httpErrors.notFound();
      }
      if (subscribedUser.subscribedToUserIds.includes(id) === false) {
        throw await fastify.httpErrors.badRequest();
      }
      const changeSubscription = (
        subscribedUser: UserEntity,
        userId: string
      ) => {
        const subscribedUsers = subscribedUser?.subscribedToUserIds;
        const updatedUsers = subscribedUsers?.filter((u) => u !== userId);
        return Object.assign({}, { subscribedToUserIds: updatedUsers });
      };
      return await fastify.db.users.change(
        userId,
        changeSubscription(subscribedUser, id)
      );
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const id = request.params.id;
      const body = request.body;
      const user = (await fastify.db.users.findOne({
        key: 'id',
        equals: id,
      })) as UserEntity;
      if (Object.is(user, null)) {
        throw await fastify.httpErrors.badRequest();
      }
      return await fastify.db.users.change(id, Object.assign(user, body));
    }
  );
};

export default plugin;
