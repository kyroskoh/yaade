package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import com.j256.ormlite.misc.TransactionManager
import io.vertx.core.json.JsonArray
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.await

class CollectionRoute(private val daoManager: DaoManager) {

    suspend fun getAllCollections(ctx: RoutingContext) {
        val collections = daoManager.collectionDao.getAll().map {
            val requests = daoManager.requestDao.getAllInCollection(it.id).map(RequestDb::toJson)
            it.toJson().put("requests", requests)
        }

        ctx.end(JsonArray(collections).encode()).await()
    }

    suspend fun postCollection(ctx: RoutingContext) {
        val request = ctx.bodyAsJson
        val userId = ctx.user().principal().getLong("id")
        val newCollection = CollectionDb(request.getString("name"), userId)

        daoManager.collectionDao.create(newCollection)

        ctx.end(newCollection.toJson().put("requests", JsonArray()).encode()).await()
    }

    suspend fun putCollection(ctx: RoutingContext) {
        val newCollection = CollectionDb.fromUpdateRequest(ctx.bodyAsJson)
        daoManager.collectionDao.update(newCollection)
        ctx.end().await()
    }

    suspend fun deleteCollection(ctx: RoutingContext) {
        val id = ctx.pathParam("id")

        TransactionManager.callInTransaction(daoManager.connectionSource) {
            daoManager.collectionDao.delete(id)
            daoManager.requestDao.deleteAllInCollection(id)
        }

        ctx.end().await()
    }

}
