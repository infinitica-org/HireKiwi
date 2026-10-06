
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Issuer
 * 
 */
export type Issuer = $Result.DefaultSelection<Prisma.$IssuerPayload>
/**
 * Model Subject
 * 
 */
export type Subject = $Result.DefaultSelection<Prisma.$SubjectPayload>
/**
 * Model Achievement
 * 
 */
export type Achievement = $Result.DefaultSelection<Prisma.$AchievementPayload>
/**
 * Model Credential
 * 
 */
export type Credential = $Result.DefaultSelection<Prisma.$CredentialPayload>
/**
 * Model Verification
 * 
 */
export type Verification = $Result.DefaultSelection<Prisma.$VerificationPayload>
/**
 * Model VerificationCheck
 * 
 */
export type VerificationCheck = $Result.DefaultSelection<Prisma.$VerificationCheckPayload>
/**
 * Model VerificationEvidence
 * 
 */
export type VerificationEvidence = $Result.DefaultSelection<Prisma.$VerificationEvidencePayload>
/**
 * Model VerificationAttempt
 * 
 */
export type VerificationAttempt = $Result.DefaultSelection<Prisma.$VerificationAttemptPayload>
/**
 * Model IssuerAdapter
 * 
 */
export type IssuerAdapter = $Result.DefaultSelection<Prisma.$IssuerAdapterPayload>
/**
 * Model TrustRegistryEntry
 * 
 */
export type TrustRegistryEntry = $Result.DefaultSelection<Prisma.$TrustRegistryEntryPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const IssuerTrustStatus: {
  TRUSTED: 'TRUSTED',
  UNVERIFIED: 'UNVERIFIED',
  BLOCKED: 'BLOCKED'
};

export type IssuerTrustStatus = (typeof IssuerTrustStatus)[keyof typeof IssuerTrustStatus]


export const CredentialType: {
  PROFESSIONAL_CERTIFICATION: 'PROFESSIONAL_CERTIFICATION',
  COURSE_COMPLETION: 'COURSE_COMPLETION',
  PROFESSIONAL_CERTIFICATE: 'PROFESSIONAL_CERTIFICATE',
  DIGITAL_BADGE: 'DIGITAL_BADGE',
  DEGREE: 'DEGREE',
  LICENSE: 'LICENSE',
  TRAINING_CREDENTIAL: 'TRAINING_CREDENTIAL',
  SKILL_CREDENTIAL: 'SKILL_CREDENTIAL',
  UNKNOWN: 'UNKNOWN'
};

export type CredentialType = (typeof CredentialType)[keyof typeof CredentialType]


export const VerificationStatus: {
  VERIFIED: 'VERIFIED',
  VERIFIED_WITH_WARNINGS: 'VERIFIED_WITH_WARNINGS',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
  SUSPENDED: 'SUSPENDED',
  INVALID: 'INVALID',
  NOT_FOUND: 'NOT_FOUND',
  UNVERIFIABLE: 'UNVERIFIABLE',
  DOCUMENT_ONLY: 'DOCUMENT_ONLY',
  VERIFICATION_PENDING: 'VERIFICATION_PENDING',
  VERIFICATION_ERROR: 'VERIFICATION_ERROR'
};

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus]


export const VerificationLevel: {
  UNVERIFIED: 'UNVERIFIED',
  DOCUMENT_PARSED: 'DOCUMENT_PARSED',
  ISSUER_RECORD_MATCH: 'ISSUER_RECORD_MATCH',
  CREDENTIAL_PLATFORM_VERIFIED: 'CREDENTIAL_PLATFORM_VERIFIED',
  CRYPTOGRAPHICALLY_VERIFIED: 'CRYPTOGRAPHICALLY_VERIFIED'
};

export type VerificationLevel = (typeof VerificationLevel)[keyof typeof VerificationLevel]


export const VerificationMethod: {
  CREDLY: 'CREDLY',
  OPEN_BADGES: 'OPEN_BADGES',
  W3C_VC: 'W3C_VC',
  ISSUER_VERIFICATION_PAGE: 'ISSUER_VERIFICATION_PAGE',
  USER_MEDIATED_PROFILE: 'USER_MEDIATED_PROFILE',
  DOCUMENT_PARSE: 'DOCUMENT_PARSE'
};

export type VerificationMethod = (typeof VerificationMethod)[keyof typeof VerificationMethod]


export const IntegrationType: {
  OFFICIAL_API: 'OFFICIAL_API',
  OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT: 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT',
  PUBLIC_CREDENTIAL_PLATFORM: 'PUBLIC_CREDENTIAL_PLATFORM',
  PUBLIC_ISSUER_VERIFICATION_PAGE: 'PUBLIC_ISSUER_VERIFICATION_PAGE',
  USER_MEDIATED: 'USER_MEDIATED',
  UNSUPPORTED: 'UNSUPPORTED'
};

export type IntegrationType = (typeof IntegrationType)[keyof typeof IntegrationType]


export const CredentialInputType: {
  URL: 'URL',
  QR_CODE: 'QR_CODE',
  PDF: 'PDF',
  IMAGE: 'IMAGE',
  JSON_CREDENTIAL: 'JSON_CREDENTIAL',
  ISSUER_AND_ID: 'ISSUER_AND_ID',
  PASTED_TEXT: 'PASTED_TEXT'
};

export type CredentialInputType = (typeof CredentialInputType)[keyof typeof CredentialInputType]


export const CheckResult: {
  PASS: 'PASS',
  FAIL: 'FAIL',
  SKIP: 'SKIP',
  UNKNOWN: 'UNKNOWN'
};

export type CheckResult = (typeof CheckResult)[keyof typeof CheckResult]


export const ConfidenceLevel: {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel]

}

export type IssuerTrustStatus = $Enums.IssuerTrustStatus

export const IssuerTrustStatus: typeof $Enums.IssuerTrustStatus

export type CredentialType = $Enums.CredentialType

export const CredentialType: typeof $Enums.CredentialType

export type VerificationStatus = $Enums.VerificationStatus

export const VerificationStatus: typeof $Enums.VerificationStatus

export type VerificationLevel = $Enums.VerificationLevel

export const VerificationLevel: typeof $Enums.VerificationLevel

export type VerificationMethod = $Enums.VerificationMethod

export const VerificationMethod: typeof $Enums.VerificationMethod

export type IntegrationType = $Enums.IntegrationType

export const IntegrationType: typeof $Enums.IntegrationType

export type CredentialInputType = $Enums.CredentialInputType

export const CredentialInputType: typeof $Enums.CredentialInputType

export type CheckResult = $Enums.CheckResult

export const CheckResult: typeof $Enums.CheckResult

export type ConfidenceLevel = $Enums.ConfidenceLevel

export const ConfidenceLevel: typeof $Enums.ConfidenceLevel

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Issuers
 * const issuers = await prisma.issuer.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Issuers
   * const issuers = await prisma.issuer.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.PrismaClientConstructorArgs<ClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.issuer`: Exposes CRUD operations for the **Issuer** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Issuers
    * const issuers = await prisma.issuer.findMany()
    * ```
    */
  get issuer(): Prisma.IssuerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.subject`: Exposes CRUD operations for the **Subject** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Subjects
    * const subjects = await prisma.subject.findMany()
    * ```
    */
  get subject(): Prisma.SubjectDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.achievement`: Exposes CRUD operations for the **Achievement** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Achievements
    * const achievements = await prisma.achievement.findMany()
    * ```
    */
  get achievement(): Prisma.AchievementDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.credential`: Exposes CRUD operations for the **Credential** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Credentials
    * const credentials = await prisma.credential.findMany()
    * ```
    */
  get credential(): Prisma.CredentialDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verification`: Exposes CRUD operations for the **Verification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Verifications
    * const verifications = await prisma.verification.findMany()
    * ```
    */
  get verification(): Prisma.VerificationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verificationCheck`: Exposes CRUD operations for the **VerificationCheck** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VerificationChecks
    * const verificationChecks = await prisma.verificationCheck.findMany()
    * ```
    */
  get verificationCheck(): Prisma.VerificationCheckDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verificationEvidence`: Exposes CRUD operations for the **VerificationEvidence** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VerificationEvidences
    * const verificationEvidences = await prisma.verificationEvidence.findMany()
    * ```
    */
  get verificationEvidence(): Prisma.VerificationEvidenceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verificationAttempt`: Exposes CRUD operations for the **VerificationAttempt** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VerificationAttempts
    * const verificationAttempts = await prisma.verificationAttempt.findMany()
    * ```
    */
  get verificationAttempt(): Prisma.VerificationAttemptDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.issuerAdapter`: Exposes CRUD operations for the **IssuerAdapter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more IssuerAdapters
    * const issuerAdapters = await prisma.issuerAdapter.findMany()
    * ```
    */
  get issuerAdapter(): Prisma.IssuerAdapterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.trustRegistryEntry`: Exposes CRUD operations for the **TrustRegistryEntry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TrustRegistryEntries
    * const trustRegistryEntries = await prisma.trustRegistryEntry.findMany()
    * ```
    */
  get trustRegistryEntry(): Prisma.TrustRegistryEntryDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.9.1
   * Query Engine version: e922089b7d7502aff4249d5da3420f6fa55fc6ad
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * Resolved type of the argument passed to the `PrismaClient` constructor.
   *
   * When called without a narrower options type (the common case), this resolves
   * to `PrismaClientOptions` directly, which produces a clear TypeScript error
   * message (`not assignable to parameter of type 'PrismaClientOptions'`) when
   * the argument is missing or incomplete. When the user supplies a narrower
   * options type (e.g. via a literal), it falls back to `Subset` to keep
   * filtering out unknown properties.
   */
  export type PrismaClientConstructorArgs<Options extends PrismaClientOptions> =
    [PrismaClientOptions] extends [Options] ? PrismaClientOptions : Subset<Options, PrismaClientOptions>;

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      ((Without<T, U> & U) | (Without<U, T> & T)) & object
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Issuer: 'Issuer',
    Subject: 'Subject',
    Achievement: 'Achievement',
    Credential: 'Credential',
    Verification: 'Verification',
    VerificationCheck: 'VerificationCheck',
    VerificationEvidence: 'VerificationEvidence',
    VerificationAttempt: 'VerificationAttempt',
    IssuerAdapter: 'IssuerAdapter',
    TrustRegistryEntry: 'TrustRegistryEntry'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "issuer" | "subject" | "achievement" | "credential" | "verification" | "verificationCheck" | "verificationEvidence" | "verificationAttempt" | "issuerAdapter" | "trustRegistryEntry"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Issuer: {
        payload: Prisma.$IssuerPayload<ExtArgs>
        fields: Prisma.IssuerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IssuerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IssuerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload>
          }
          findFirst: {
            args: Prisma.IssuerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IssuerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload>
          }
          findMany: {
            args: Prisma.IssuerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload>[]
          }
          create: {
            args: Prisma.IssuerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload>
          }
          createMany: {
            args: Prisma.IssuerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IssuerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload>[]
          }
          delete: {
            args: Prisma.IssuerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload>
          }
          update: {
            args: Prisma.IssuerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload>
          }
          deleteMany: {
            args: Prisma.IssuerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IssuerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IssuerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload>[]
          }
          upsert: {
            args: Prisma.IssuerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerPayload>
          }
          aggregate: {
            args: Prisma.IssuerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIssuer>
          }
          groupBy: {
            args: Prisma.IssuerGroupByArgs<ExtArgs>
            result: $Utils.Optional<IssuerGroupByOutputType>[]
          }
          count: {
            args: Prisma.IssuerCountArgs<ExtArgs>
            result: $Utils.Optional<IssuerCountAggregateOutputType> | number
          }
        }
      }
      Subject: {
        payload: Prisma.$SubjectPayload<ExtArgs>
        fields: Prisma.SubjectFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SubjectFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SubjectFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          findFirst: {
            args: Prisma.SubjectFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SubjectFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          findMany: {
            args: Prisma.SubjectFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>[]
          }
          create: {
            args: Prisma.SubjectCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          createMany: {
            args: Prisma.SubjectCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SubjectCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>[]
          }
          delete: {
            args: Prisma.SubjectDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          update: {
            args: Prisma.SubjectUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          deleteMany: {
            args: Prisma.SubjectDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SubjectUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SubjectUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>[]
          }
          upsert: {
            args: Prisma.SubjectUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          aggregate: {
            args: Prisma.SubjectAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSubject>
          }
          groupBy: {
            args: Prisma.SubjectGroupByArgs<ExtArgs>
            result: $Utils.Optional<SubjectGroupByOutputType>[]
          }
          count: {
            args: Prisma.SubjectCountArgs<ExtArgs>
            result: $Utils.Optional<SubjectCountAggregateOutputType> | number
          }
        }
      }
      Achievement: {
        payload: Prisma.$AchievementPayload<ExtArgs>
        fields: Prisma.AchievementFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AchievementFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AchievementFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload>
          }
          findFirst: {
            args: Prisma.AchievementFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AchievementFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload>
          }
          findMany: {
            args: Prisma.AchievementFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload>[]
          }
          create: {
            args: Prisma.AchievementCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload>
          }
          createMany: {
            args: Prisma.AchievementCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AchievementCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload>[]
          }
          delete: {
            args: Prisma.AchievementDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload>
          }
          update: {
            args: Prisma.AchievementUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload>
          }
          deleteMany: {
            args: Prisma.AchievementDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AchievementUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AchievementUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload>[]
          }
          upsert: {
            args: Prisma.AchievementUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AchievementPayload>
          }
          aggregate: {
            args: Prisma.AchievementAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAchievement>
          }
          groupBy: {
            args: Prisma.AchievementGroupByArgs<ExtArgs>
            result: $Utils.Optional<AchievementGroupByOutputType>[]
          }
          count: {
            args: Prisma.AchievementCountArgs<ExtArgs>
            result: $Utils.Optional<AchievementCountAggregateOutputType> | number
          }
        }
      }
      Credential: {
        payload: Prisma.$CredentialPayload<ExtArgs>
        fields: Prisma.CredentialFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CredentialFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CredentialFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          findFirst: {
            args: Prisma.CredentialFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CredentialFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          findMany: {
            args: Prisma.CredentialFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>[]
          }
          create: {
            args: Prisma.CredentialCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          createMany: {
            args: Prisma.CredentialCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CredentialCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>[]
          }
          delete: {
            args: Prisma.CredentialDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          update: {
            args: Prisma.CredentialUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          deleteMany: {
            args: Prisma.CredentialDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CredentialUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CredentialUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>[]
          }
          upsert: {
            args: Prisma.CredentialUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          aggregate: {
            args: Prisma.CredentialAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCredential>
          }
          groupBy: {
            args: Prisma.CredentialGroupByArgs<ExtArgs>
            result: $Utils.Optional<CredentialGroupByOutputType>[]
          }
          count: {
            args: Prisma.CredentialCountArgs<ExtArgs>
            result: $Utils.Optional<CredentialCountAggregateOutputType> | number
          }
        }
      }
      Verification: {
        payload: Prisma.$VerificationPayload<ExtArgs>
        fields: Prisma.VerificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          findFirst: {
            args: Prisma.VerificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          findMany: {
            args: Prisma.VerificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>[]
          }
          create: {
            args: Prisma.VerificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          createMany: {
            args: Prisma.VerificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>[]
          }
          delete: {
            args: Prisma.VerificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          update: {
            args: Prisma.VerificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          deleteMany: {
            args: Prisma.VerificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VerificationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>[]
          }
          upsert: {
            args: Prisma.VerificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          aggregate: {
            args: Prisma.VerificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerification>
          }
          groupBy: {
            args: Prisma.VerificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationCountAggregateOutputType> | number
          }
        }
      }
      VerificationCheck: {
        payload: Prisma.$VerificationCheckPayload<ExtArgs>
        fields: Prisma.VerificationCheckFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationCheckFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationCheckFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload>
          }
          findFirst: {
            args: Prisma.VerificationCheckFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationCheckFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload>
          }
          findMany: {
            args: Prisma.VerificationCheckFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload>[]
          }
          create: {
            args: Prisma.VerificationCheckCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload>
          }
          createMany: {
            args: Prisma.VerificationCheckCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationCheckCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload>[]
          }
          delete: {
            args: Prisma.VerificationCheckDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload>
          }
          update: {
            args: Prisma.VerificationCheckUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload>
          }
          deleteMany: {
            args: Prisma.VerificationCheckDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationCheckUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VerificationCheckUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload>[]
          }
          upsert: {
            args: Prisma.VerificationCheckUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationCheckPayload>
          }
          aggregate: {
            args: Prisma.VerificationCheckAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerificationCheck>
          }
          groupBy: {
            args: Prisma.VerificationCheckGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationCheckGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationCheckCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationCheckCountAggregateOutputType> | number
          }
        }
      }
      VerificationEvidence: {
        payload: Prisma.$VerificationEvidencePayload<ExtArgs>
        fields: Prisma.VerificationEvidenceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationEvidenceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationEvidenceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload>
          }
          findFirst: {
            args: Prisma.VerificationEvidenceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationEvidenceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload>
          }
          findMany: {
            args: Prisma.VerificationEvidenceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload>[]
          }
          create: {
            args: Prisma.VerificationEvidenceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload>
          }
          createMany: {
            args: Prisma.VerificationEvidenceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationEvidenceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload>[]
          }
          delete: {
            args: Prisma.VerificationEvidenceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload>
          }
          update: {
            args: Prisma.VerificationEvidenceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload>
          }
          deleteMany: {
            args: Prisma.VerificationEvidenceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationEvidenceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VerificationEvidenceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload>[]
          }
          upsert: {
            args: Prisma.VerificationEvidenceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationEvidencePayload>
          }
          aggregate: {
            args: Prisma.VerificationEvidenceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerificationEvidence>
          }
          groupBy: {
            args: Prisma.VerificationEvidenceGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationEvidenceGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationEvidenceCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationEvidenceCountAggregateOutputType> | number
          }
        }
      }
      VerificationAttempt: {
        payload: Prisma.$VerificationAttemptPayload<ExtArgs>
        fields: Prisma.VerificationAttemptFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationAttemptFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationAttemptFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload>
          }
          findFirst: {
            args: Prisma.VerificationAttemptFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationAttemptFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload>
          }
          findMany: {
            args: Prisma.VerificationAttemptFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload>[]
          }
          create: {
            args: Prisma.VerificationAttemptCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload>
          }
          createMany: {
            args: Prisma.VerificationAttemptCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationAttemptCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload>[]
          }
          delete: {
            args: Prisma.VerificationAttemptDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload>
          }
          update: {
            args: Prisma.VerificationAttemptUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload>
          }
          deleteMany: {
            args: Prisma.VerificationAttemptDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationAttemptUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VerificationAttemptUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload>[]
          }
          upsert: {
            args: Prisma.VerificationAttemptUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationAttemptPayload>
          }
          aggregate: {
            args: Prisma.VerificationAttemptAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerificationAttempt>
          }
          groupBy: {
            args: Prisma.VerificationAttemptGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationAttemptGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationAttemptCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationAttemptCountAggregateOutputType> | number
          }
        }
      }
      IssuerAdapter: {
        payload: Prisma.$IssuerAdapterPayload<ExtArgs>
        fields: Prisma.IssuerAdapterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IssuerAdapterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IssuerAdapterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload>
          }
          findFirst: {
            args: Prisma.IssuerAdapterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IssuerAdapterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload>
          }
          findMany: {
            args: Prisma.IssuerAdapterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload>[]
          }
          create: {
            args: Prisma.IssuerAdapterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload>
          }
          createMany: {
            args: Prisma.IssuerAdapterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IssuerAdapterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload>[]
          }
          delete: {
            args: Prisma.IssuerAdapterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload>
          }
          update: {
            args: Prisma.IssuerAdapterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload>
          }
          deleteMany: {
            args: Prisma.IssuerAdapterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IssuerAdapterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IssuerAdapterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload>[]
          }
          upsert: {
            args: Prisma.IssuerAdapterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IssuerAdapterPayload>
          }
          aggregate: {
            args: Prisma.IssuerAdapterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIssuerAdapter>
          }
          groupBy: {
            args: Prisma.IssuerAdapterGroupByArgs<ExtArgs>
            result: $Utils.Optional<IssuerAdapterGroupByOutputType>[]
          }
          count: {
            args: Prisma.IssuerAdapterCountArgs<ExtArgs>
            result: $Utils.Optional<IssuerAdapterCountAggregateOutputType> | number
          }
        }
      }
      TrustRegistryEntry: {
        payload: Prisma.$TrustRegistryEntryPayload<ExtArgs>
        fields: Prisma.TrustRegistryEntryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TrustRegistryEntryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TrustRegistryEntryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload>
          }
          findFirst: {
            args: Prisma.TrustRegistryEntryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TrustRegistryEntryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload>
          }
          findMany: {
            args: Prisma.TrustRegistryEntryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload>[]
          }
          create: {
            args: Prisma.TrustRegistryEntryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload>
          }
          createMany: {
            args: Prisma.TrustRegistryEntryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TrustRegistryEntryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload>[]
          }
          delete: {
            args: Prisma.TrustRegistryEntryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload>
          }
          update: {
            args: Prisma.TrustRegistryEntryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload>
          }
          deleteMany: {
            args: Prisma.TrustRegistryEntryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TrustRegistryEntryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TrustRegistryEntryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload>[]
          }
          upsert: {
            args: Prisma.TrustRegistryEntryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrustRegistryEntryPayload>
          }
          aggregate: {
            args: Prisma.TrustRegistryEntryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTrustRegistryEntry>
          }
          groupBy: {
            args: Prisma.TrustRegistryEntryGroupByArgs<ExtArgs>
            result: $Utils.Optional<TrustRegistryEntryGroupByOutputType>[]
          }
          count: {
            args: Prisma.TrustRegistryEntryCountArgs<ExtArgs>
            result: $Utils.Optional<TrustRegistryEntryCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * A driver adapter that PrismaClient uses to connect to your database, such as the ones provided by `@prisma/adapter-pg`, `@prisma/adapter-libsql`, `@prisma/adapter-planetscale`, etc.
     * 
     * A driver adapter is **required** unless you connect to your database through Prisma Accelerate (in which case use `accelerateUrl` instead).
     * 
     * Learn more: https://pris.ly/d/driver-adapters
     * 
     * @example
     * ```ts
     * import { PrismaPg } from '@prisma/adapter-pg'
     * import { PrismaClient } from './generated/prisma/client'
     * 
     * const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
     * const prisma = new PrismaClient({ adapter })
     * ```
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * The Prisma Accelerate connection URL. Use this option to connect to your database through Prisma Accelerate instead of using a driver adapter to connect directly.
     * 
     * Learn more: https://pris.ly/d/accelerate
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    issuer?: IssuerOmit
    subject?: SubjectOmit
    achievement?: AchievementOmit
    credential?: CredentialOmit
    verification?: VerificationOmit
    verificationCheck?: VerificationCheckOmit
    verificationEvidence?: VerificationEvidenceOmit
    verificationAttempt?: VerificationAttemptOmit
    issuerAdapter?: IssuerAdapterOmit
    trustRegistryEntry?: TrustRegistryEntryOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type IssuerCountOutputType
   */

  export type IssuerCountOutputType = {
    credentials: number
    adapters: number
    trustRegistry: number
  }

  export type IssuerCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credentials?: boolean | IssuerCountOutputTypeCountCredentialsArgs
    adapters?: boolean | IssuerCountOutputTypeCountAdaptersArgs
    trustRegistry?: boolean | IssuerCountOutputTypeCountTrustRegistryArgs
  }

  // Custom InputTypes
  /**
   * IssuerCountOutputType without action
   */
  export type IssuerCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerCountOutputType
     */
    select?: IssuerCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * IssuerCountOutputType without action
   */
  export type IssuerCountOutputTypeCountCredentialsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CredentialWhereInput
  }

  /**
   * IssuerCountOutputType without action
   */
  export type IssuerCountOutputTypeCountAdaptersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IssuerAdapterWhereInput
  }

  /**
   * IssuerCountOutputType without action
   */
  export type IssuerCountOutputTypeCountTrustRegistryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrustRegistryEntryWhereInput
  }


  /**
   * Count Type SubjectCountOutputType
   */

  export type SubjectCountOutputType = {
    credentials: number
  }

  export type SubjectCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credentials?: boolean | SubjectCountOutputTypeCountCredentialsArgs
  }

  // Custom InputTypes
  /**
   * SubjectCountOutputType without action
   */
  export type SubjectCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubjectCountOutputType
     */
    select?: SubjectCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SubjectCountOutputType without action
   */
  export type SubjectCountOutputTypeCountCredentialsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CredentialWhereInput
  }


  /**
   * Count Type AchievementCountOutputType
   */

  export type AchievementCountOutputType = {
    credentials: number
  }

  export type AchievementCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credentials?: boolean | AchievementCountOutputTypeCountCredentialsArgs
  }

  // Custom InputTypes
  /**
   * AchievementCountOutputType without action
   */
  export type AchievementCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AchievementCountOutputType
     */
    select?: AchievementCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AchievementCountOutputType without action
   */
  export type AchievementCountOutputTypeCountCredentialsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CredentialWhereInput
  }


  /**
   * Count Type CredentialCountOutputType
   */

  export type CredentialCountOutputType = {
    verifications: number
  }

  export type CredentialCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verifications?: boolean | CredentialCountOutputTypeCountVerificationsArgs
  }

  // Custom InputTypes
  /**
   * CredentialCountOutputType without action
   */
  export type CredentialCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CredentialCountOutputType
     */
    select?: CredentialCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CredentialCountOutputType without action
   */
  export type CredentialCountOutputTypeCountVerificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationWhereInput
  }


  /**
   * Count Type VerificationCountOutputType
   */

  export type VerificationCountOutputType = {
    checks: number
    evidence: number
    attempts: number
  }

  export type VerificationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    checks?: boolean | VerificationCountOutputTypeCountChecksArgs
    evidence?: boolean | VerificationCountOutputTypeCountEvidenceArgs
    attempts?: boolean | VerificationCountOutputTypeCountAttemptsArgs
  }

  // Custom InputTypes
  /**
   * VerificationCountOutputType without action
   */
  export type VerificationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCountOutputType
     */
    select?: VerificationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * VerificationCountOutputType without action
   */
  export type VerificationCountOutputTypeCountChecksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationCheckWhereInput
  }

  /**
   * VerificationCountOutputType without action
   */
  export type VerificationCountOutputTypeCountEvidenceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationEvidenceWhereInput
  }

  /**
   * VerificationCountOutputType without action
   */
  export type VerificationCountOutputTypeCountAttemptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationAttemptWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Issuer
   */

  export type AggregateIssuer = {
    _count: IssuerCountAggregateOutputType | null
    _min: IssuerMinAggregateOutputType | null
    _max: IssuerMaxAggregateOutputType | null
  }

  export type IssuerMinAggregateOutputType = {
    id: string | null
    name: string | null
    domain: string | null
    issuerType: string | null
    trustStatus: $Enums.IssuerTrustStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type IssuerMaxAggregateOutputType = {
    id: string | null
    name: string | null
    domain: string | null
    issuerType: string | null
    trustStatus: $Enums.IssuerTrustStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type IssuerCountAggregateOutputType = {
    id: number
    name: number
    domain: number
    issuerType: number
    trustStatus: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type IssuerMinAggregateInputType = {
    id?: true
    name?: true
    domain?: true
    issuerType?: true
    trustStatus?: true
    createdAt?: true
    updatedAt?: true
  }

  export type IssuerMaxAggregateInputType = {
    id?: true
    name?: true
    domain?: true
    issuerType?: true
    trustStatus?: true
    createdAt?: true
    updatedAt?: true
  }

  export type IssuerCountAggregateInputType = {
    id?: true
    name?: true
    domain?: true
    issuerType?: true
    trustStatus?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type IssuerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Issuer to aggregate.
     */
    where?: IssuerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Issuers to fetch.
     */
    orderBy?: IssuerOrderByWithRelationInput | IssuerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IssuerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Issuers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Issuers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Issuers
    **/
    _count?: true | IssuerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IssuerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IssuerMaxAggregateInputType
  }

  export type GetIssuerAggregateType<T extends IssuerAggregateArgs> = {
        [P in keyof T & keyof AggregateIssuer]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIssuer[P]>
      : GetScalarType<T[P], AggregateIssuer[P]>
  }




  export type IssuerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IssuerWhereInput
    orderBy?: IssuerOrderByWithAggregationInput | IssuerOrderByWithAggregationInput[]
    by: IssuerScalarFieldEnum[] | IssuerScalarFieldEnum
    having?: IssuerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IssuerCountAggregateInputType | true
    _min?: IssuerMinAggregateInputType
    _max?: IssuerMaxAggregateInputType
  }

  export type IssuerGroupByOutputType = {
    id: string
    name: string
    domain: string | null
    issuerType: string
    trustStatus: $Enums.IssuerTrustStatus
    createdAt: Date
    updatedAt: Date
    _count: IssuerCountAggregateOutputType | null
    _min: IssuerMinAggregateOutputType | null
    _max: IssuerMaxAggregateOutputType | null
  }

  type GetIssuerGroupByPayload<T extends IssuerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IssuerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IssuerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IssuerGroupByOutputType[P]>
            : GetScalarType<T[P], IssuerGroupByOutputType[P]>
        }
      >
    >


  export type IssuerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    domain?: boolean
    issuerType?: boolean
    trustStatus?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    credentials?: boolean | Issuer$credentialsArgs<ExtArgs>
    adapters?: boolean | Issuer$adaptersArgs<ExtArgs>
    trustRegistry?: boolean | Issuer$trustRegistryArgs<ExtArgs>
    _count?: boolean | IssuerCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["issuer"]>

  export type IssuerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    domain?: boolean
    issuerType?: boolean
    trustStatus?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["issuer"]>

  export type IssuerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    domain?: boolean
    issuerType?: boolean
    trustStatus?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["issuer"]>

  export type IssuerSelectScalar = {
    id?: boolean
    name?: boolean
    domain?: boolean
    issuerType?: boolean
    trustStatus?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type IssuerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "domain" | "issuerType" | "trustStatus" | "createdAt" | "updatedAt", ExtArgs["result"]["issuer"]>
  export type IssuerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credentials?: boolean | Issuer$credentialsArgs<ExtArgs>
    adapters?: boolean | Issuer$adaptersArgs<ExtArgs>
    trustRegistry?: boolean | Issuer$trustRegistryArgs<ExtArgs>
    _count?: boolean | IssuerCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type IssuerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type IssuerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $IssuerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Issuer"
    objects: {
      credentials: Prisma.$CredentialPayload<ExtArgs>[]
      adapters: Prisma.$IssuerAdapterPayload<ExtArgs>[]
      trustRegistry: Prisma.$TrustRegistryEntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      domain: string | null
      issuerType: string
      trustStatus: $Enums.IssuerTrustStatus
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["issuer"]>
    composites: {}
  }

  type IssuerGetPayload<S extends boolean | null | undefined | IssuerDefaultArgs> = $Result.GetResult<Prisma.$IssuerPayload, S>

  type IssuerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IssuerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IssuerCountAggregateInputType | true
    }

  export interface IssuerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Issuer'], meta: { name: 'Issuer' } }
    /**
     * Find zero or one Issuer that matches the filter.
     * @param {IssuerFindUniqueArgs} args - Arguments to find a Issuer
     * @example
     * // Get one Issuer
     * const issuer = await prisma.issuer.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IssuerFindUniqueArgs>(args: SelectSubset<T, IssuerFindUniqueArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Issuer that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IssuerFindUniqueOrThrowArgs} args - Arguments to find a Issuer
     * @example
     * // Get one Issuer
     * const issuer = await prisma.issuer.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IssuerFindUniqueOrThrowArgs>(args: SelectSubset<T, IssuerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Issuer that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerFindFirstArgs} args - Arguments to find a Issuer
     * @example
     * // Get one Issuer
     * const issuer = await prisma.issuer.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IssuerFindFirstArgs>(args?: SelectSubset<T, IssuerFindFirstArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Issuer that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerFindFirstOrThrowArgs} args - Arguments to find a Issuer
     * @example
     * // Get one Issuer
     * const issuer = await prisma.issuer.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IssuerFindFirstOrThrowArgs>(args?: SelectSubset<T, IssuerFindFirstOrThrowArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Issuers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Issuers
     * const issuers = await prisma.issuer.findMany()
     * 
     * // Get first 10 Issuers
     * const issuers = await prisma.issuer.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const issuerWithIdOnly = await prisma.issuer.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IssuerFindManyArgs>(args?: SelectSubset<T, IssuerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Issuer.
     * @param {IssuerCreateArgs} args - Arguments to create a Issuer.
     * @example
     * // Create one Issuer
     * const Issuer = await prisma.issuer.create({
     *   data: {
     *     // ... data to create a Issuer
     *   }
     * })
     * 
     */
    create<T extends IssuerCreateArgs>(args: SelectSubset<T, IssuerCreateArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Issuers.
     * @param {IssuerCreateManyArgs} args - Arguments to create many Issuers.
     * @example
     * // Create many Issuers
     * const issuer = await prisma.issuer.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IssuerCreateManyArgs>(args?: SelectSubset<T, IssuerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Issuers and returns the data saved in the database.
     * @param {IssuerCreateManyAndReturnArgs} args - Arguments to create many Issuers.
     * @example
     * // Create many Issuers
     * const issuer = await prisma.issuer.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Issuers and only return the `id`
     * const issuerWithIdOnly = await prisma.issuer.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IssuerCreateManyAndReturnArgs>(args?: SelectSubset<T, IssuerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Issuer.
     * @param {IssuerDeleteArgs} args - Arguments to delete one Issuer.
     * @example
     * // Delete one Issuer
     * const Issuer = await prisma.issuer.delete({
     *   where: {
     *     // ... filter to delete one Issuer
     *   }
     * })
     * 
     */
    delete<T extends IssuerDeleteArgs>(args: SelectSubset<T, IssuerDeleteArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Issuer.
     * @param {IssuerUpdateArgs} args - Arguments to update one Issuer.
     * @example
     * // Update one Issuer
     * const issuer = await prisma.issuer.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IssuerUpdateArgs>(args: SelectSubset<T, IssuerUpdateArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Issuers.
     * @param {IssuerDeleteManyArgs} args - Arguments to filter Issuers to delete.
     * @example
     * // Delete a few Issuers
     * const { count } = await prisma.issuer.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IssuerDeleteManyArgs>(args?: SelectSubset<T, IssuerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Issuers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Issuers
     * const issuer = await prisma.issuer.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IssuerUpdateManyArgs>(args: SelectSubset<T, IssuerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Issuers and returns the data updated in the database.
     * @param {IssuerUpdateManyAndReturnArgs} args - Arguments to update many Issuers.
     * @example
     * // Update many Issuers
     * const issuer = await prisma.issuer.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Issuers and only return the `id`
     * const issuerWithIdOnly = await prisma.issuer.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IssuerUpdateManyAndReturnArgs>(args: SelectSubset<T, IssuerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Issuer.
     * @param {IssuerUpsertArgs} args - Arguments to update or create a Issuer.
     * @example
     * // Update or create a Issuer
     * const issuer = await prisma.issuer.upsert({
     *   create: {
     *     // ... data to create a Issuer
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Issuer we want to update
     *   }
     * })
     */
    upsert<T extends IssuerUpsertArgs>(args: SelectSubset<T, IssuerUpsertArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Issuers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerCountArgs} args - Arguments to filter Issuers to count.
     * @example
     * // Count the number of Issuers
     * const count = await prisma.issuer.count({
     *   where: {
     *     // ... the filter for the Issuers we want to count
     *   }
     * })
    **/
    count<T extends IssuerCountArgs>(
      args?: Subset<T, IssuerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IssuerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Issuer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IssuerAggregateArgs>(args: Subset<T, IssuerAggregateArgs>): Prisma.PrismaPromise<GetIssuerAggregateType<T>>

    /**
     * Group by Issuer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IssuerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IssuerGroupByArgs['orderBy'] }
        : { orderBy?: IssuerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IssuerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIssuerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Issuer model
   */
  readonly fields: IssuerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Issuer.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IssuerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    credentials<T extends Issuer$credentialsArgs<ExtArgs> = {}>(args?: Subset<T, Issuer$credentialsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    adapters<T extends Issuer$adaptersArgs<ExtArgs> = {}>(args?: Subset<T, Issuer$adaptersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    trustRegistry<T extends Issuer$trustRegistryArgs<ExtArgs> = {}>(args?: Subset<T, Issuer$trustRegistryArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Issuer model
   */
  interface IssuerFieldRefs {
    readonly id: FieldRef<"Issuer", 'String'>
    readonly name: FieldRef<"Issuer", 'String'>
    readonly domain: FieldRef<"Issuer", 'String'>
    readonly issuerType: FieldRef<"Issuer", 'String'>
    readonly trustStatus: FieldRef<"Issuer", 'IssuerTrustStatus'>
    readonly createdAt: FieldRef<"Issuer", 'DateTime'>
    readonly updatedAt: FieldRef<"Issuer", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Issuer findUnique
   */
  export type IssuerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    /**
     * Filter, which Issuer to fetch.
     */
    where: IssuerWhereUniqueInput
  }

  /**
   * Issuer findUniqueOrThrow
   */
  export type IssuerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    /**
     * Filter, which Issuer to fetch.
     */
    where: IssuerWhereUniqueInput
  }

  /**
   * Issuer findFirst
   */
  export type IssuerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    /**
     * Filter, which Issuer to fetch.
     */
    where?: IssuerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Issuers to fetch.
     */
    orderBy?: IssuerOrderByWithRelationInput | IssuerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Issuers.
     */
    cursor?: IssuerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Issuers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Issuers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Issuers.
     */
    distinct?: IssuerScalarFieldEnum | IssuerScalarFieldEnum[]
  }

  /**
   * Issuer findFirstOrThrow
   */
  export type IssuerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    /**
     * Filter, which Issuer to fetch.
     */
    where?: IssuerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Issuers to fetch.
     */
    orderBy?: IssuerOrderByWithRelationInput | IssuerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Issuers.
     */
    cursor?: IssuerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Issuers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Issuers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Issuers.
     */
    distinct?: IssuerScalarFieldEnum | IssuerScalarFieldEnum[]
  }

  /**
   * Issuer findMany
   */
  export type IssuerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    /**
     * Filter, which Issuers to fetch.
     */
    where?: IssuerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Issuers to fetch.
     */
    orderBy?: IssuerOrderByWithRelationInput | IssuerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Issuers.
     */
    cursor?: IssuerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Issuers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Issuers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Issuers.
     */
    distinct?: IssuerScalarFieldEnum | IssuerScalarFieldEnum[]
  }

  /**
   * Issuer create
   */
  export type IssuerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    /**
     * The data needed to create a Issuer.
     */
    data: XOR<IssuerCreateInput, IssuerUncheckedCreateInput>
  }

  /**
   * Issuer createMany
   */
  export type IssuerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Issuers.
     */
    data: IssuerCreateManyInput | IssuerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Issuer createManyAndReturn
   */
  export type IssuerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * The data used to create many Issuers.
     */
    data: IssuerCreateManyInput | IssuerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Issuer update
   */
  export type IssuerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    /**
     * The data needed to update a Issuer.
     */
    data: XOR<IssuerUpdateInput, IssuerUncheckedUpdateInput>
    /**
     * Choose, which Issuer to update.
     */
    where: IssuerWhereUniqueInput
  }

  /**
   * Issuer updateMany
   */
  export type IssuerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Issuers.
     */
    data: XOR<IssuerUpdateManyMutationInput, IssuerUncheckedUpdateManyInput>
    /**
     * Filter which Issuers to update
     */
    where?: IssuerWhereInput
    /**
     * Limit how many Issuers to update.
     */
    limit?: number
  }

  /**
   * Issuer updateManyAndReturn
   */
  export type IssuerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * The data used to update Issuers.
     */
    data: XOR<IssuerUpdateManyMutationInput, IssuerUncheckedUpdateManyInput>
    /**
     * Filter which Issuers to update
     */
    where?: IssuerWhereInput
    /**
     * Limit how many Issuers to update.
     */
    limit?: number
  }

  /**
   * Issuer upsert
   */
  export type IssuerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    /**
     * The filter to search for the Issuer to update in case it exists.
     */
    where: IssuerWhereUniqueInput
    /**
     * In case the Issuer found by the `where` argument doesn't exist, create a new Issuer with this data.
     */
    create: XOR<IssuerCreateInput, IssuerUncheckedCreateInput>
    /**
     * In case the Issuer was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IssuerUpdateInput, IssuerUncheckedUpdateInput>
  }

  /**
   * Issuer delete
   */
  export type IssuerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    /**
     * Filter which Issuer to delete.
     */
    where: IssuerWhereUniqueInput
  }

  /**
   * Issuer deleteMany
   */
  export type IssuerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Issuers to delete
     */
    where?: IssuerWhereInput
    /**
     * Limit how many Issuers to delete.
     */
    limit?: number
  }

  /**
   * Issuer.credentials
   */
  export type Issuer$credentialsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    where?: CredentialWhereInput
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    cursor?: CredentialWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * Issuer.adapters
   */
  export type Issuer$adaptersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    where?: IssuerAdapterWhereInput
    orderBy?: IssuerAdapterOrderByWithRelationInput | IssuerAdapterOrderByWithRelationInput[]
    cursor?: IssuerAdapterWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IssuerAdapterScalarFieldEnum | IssuerAdapterScalarFieldEnum[]
  }

  /**
   * Issuer.trustRegistry
   */
  export type Issuer$trustRegistryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    where?: TrustRegistryEntryWhereInput
    orderBy?: TrustRegistryEntryOrderByWithRelationInput | TrustRegistryEntryOrderByWithRelationInput[]
    cursor?: TrustRegistryEntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TrustRegistryEntryScalarFieldEnum | TrustRegistryEntryScalarFieldEnum[]
  }

  /**
   * Issuer without action
   */
  export type IssuerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
  }


  /**
   * Model Subject
   */

  export type AggregateSubject = {
    _count: SubjectCountAggregateOutputType | null
    _min: SubjectMinAggregateOutputType | null
    _max: SubjectMaxAggregateOutputType | null
  }

  export type SubjectMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    externalIdentifier: string | null
    createdAt: Date | null
  }

  export type SubjectMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    externalIdentifier: string | null
    createdAt: Date | null
  }

  export type SubjectCountAggregateOutputType = {
    id: number
    name: number
    email: number
    externalIdentifier: number
    createdAt: number
    _all: number
  }


  export type SubjectMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    externalIdentifier?: true
    createdAt?: true
  }

  export type SubjectMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    externalIdentifier?: true
    createdAt?: true
  }

  export type SubjectCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    externalIdentifier?: true
    createdAt?: true
    _all?: true
  }

  export type SubjectAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subject to aggregate.
     */
    where?: SubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subjects to fetch.
     */
    orderBy?: SubjectOrderByWithRelationInput | SubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Subjects
    **/
    _count?: true | SubjectCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SubjectMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SubjectMaxAggregateInputType
  }

  export type GetSubjectAggregateType<T extends SubjectAggregateArgs> = {
        [P in keyof T & keyof AggregateSubject]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubject[P]>
      : GetScalarType<T[P], AggregateSubject[P]>
  }




  export type SubjectGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubjectWhereInput
    orderBy?: SubjectOrderByWithAggregationInput | SubjectOrderByWithAggregationInput[]
    by: SubjectScalarFieldEnum[] | SubjectScalarFieldEnum
    having?: SubjectScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SubjectCountAggregateInputType | true
    _min?: SubjectMinAggregateInputType
    _max?: SubjectMaxAggregateInputType
  }

  export type SubjectGroupByOutputType = {
    id: string
    name: string
    email: string | null
    externalIdentifier: string | null
    createdAt: Date
    _count: SubjectCountAggregateOutputType | null
    _min: SubjectMinAggregateOutputType | null
    _max: SubjectMaxAggregateOutputType | null
  }

  type GetSubjectGroupByPayload<T extends SubjectGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubjectGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SubjectGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SubjectGroupByOutputType[P]>
            : GetScalarType<T[P], SubjectGroupByOutputType[P]>
        }
      >
    >


  export type SubjectSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    externalIdentifier?: boolean
    createdAt?: boolean
    credentials?: boolean | Subject$credentialsArgs<ExtArgs>
    _count?: boolean | SubjectCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subject"]>

  export type SubjectSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    externalIdentifier?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["subject"]>

  export type SubjectSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    externalIdentifier?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["subject"]>

  export type SubjectSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    externalIdentifier?: boolean
    createdAt?: boolean
  }

  export type SubjectOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "externalIdentifier" | "createdAt", ExtArgs["result"]["subject"]>
  export type SubjectInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credentials?: boolean | Subject$credentialsArgs<ExtArgs>
    _count?: boolean | SubjectCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SubjectIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SubjectIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SubjectPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Subject"
    objects: {
      credentials: Prisma.$CredentialPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      email: string | null
      externalIdentifier: string | null
      createdAt: Date
    }, ExtArgs["result"]["subject"]>
    composites: {}
  }

  type SubjectGetPayload<S extends boolean | null | undefined | SubjectDefaultArgs> = $Result.GetResult<Prisma.$SubjectPayload, S>

  type SubjectCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SubjectFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SubjectCountAggregateInputType | true
    }

  export interface SubjectDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Subject'], meta: { name: 'Subject' } }
    /**
     * Find zero or one Subject that matches the filter.
     * @param {SubjectFindUniqueArgs} args - Arguments to find a Subject
     * @example
     * // Get one Subject
     * const subject = await prisma.subject.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubjectFindUniqueArgs>(args: SelectSubset<T, SubjectFindUniqueArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Subject that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SubjectFindUniqueOrThrowArgs} args - Arguments to find a Subject
     * @example
     * // Get one Subject
     * const subject = await prisma.subject.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubjectFindUniqueOrThrowArgs>(args: SelectSubset<T, SubjectFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subject that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectFindFirstArgs} args - Arguments to find a Subject
     * @example
     * // Get one Subject
     * const subject = await prisma.subject.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubjectFindFirstArgs>(args?: SelectSubset<T, SubjectFindFirstArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subject that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectFindFirstOrThrowArgs} args - Arguments to find a Subject
     * @example
     * // Get one Subject
     * const subject = await prisma.subject.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubjectFindFirstOrThrowArgs>(args?: SelectSubset<T, SubjectFindFirstOrThrowArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Subjects that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Subjects
     * const subjects = await prisma.subject.findMany()
     * 
     * // Get first 10 Subjects
     * const subjects = await prisma.subject.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const subjectWithIdOnly = await prisma.subject.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SubjectFindManyArgs>(args?: SelectSubset<T, SubjectFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Subject.
     * @param {SubjectCreateArgs} args - Arguments to create a Subject.
     * @example
     * // Create one Subject
     * const Subject = await prisma.subject.create({
     *   data: {
     *     // ... data to create a Subject
     *   }
     * })
     * 
     */
    create<T extends SubjectCreateArgs>(args: SelectSubset<T, SubjectCreateArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Subjects.
     * @param {SubjectCreateManyArgs} args - Arguments to create many Subjects.
     * @example
     * // Create many Subjects
     * const subject = await prisma.subject.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SubjectCreateManyArgs>(args?: SelectSubset<T, SubjectCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Subjects and returns the data saved in the database.
     * @param {SubjectCreateManyAndReturnArgs} args - Arguments to create many Subjects.
     * @example
     * // Create many Subjects
     * const subject = await prisma.subject.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Subjects and only return the `id`
     * const subjectWithIdOnly = await prisma.subject.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SubjectCreateManyAndReturnArgs>(args?: SelectSubset<T, SubjectCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Subject.
     * @param {SubjectDeleteArgs} args - Arguments to delete one Subject.
     * @example
     * // Delete one Subject
     * const Subject = await prisma.subject.delete({
     *   where: {
     *     // ... filter to delete one Subject
     *   }
     * })
     * 
     */
    delete<T extends SubjectDeleteArgs>(args: SelectSubset<T, SubjectDeleteArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Subject.
     * @param {SubjectUpdateArgs} args - Arguments to update one Subject.
     * @example
     * // Update one Subject
     * const subject = await prisma.subject.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SubjectUpdateArgs>(args: SelectSubset<T, SubjectUpdateArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Subjects.
     * @param {SubjectDeleteManyArgs} args - Arguments to filter Subjects to delete.
     * @example
     * // Delete a few Subjects
     * const { count } = await prisma.subject.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SubjectDeleteManyArgs>(args?: SelectSubset<T, SubjectDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subjects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Subjects
     * const subject = await prisma.subject.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SubjectUpdateManyArgs>(args: SelectSubset<T, SubjectUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subjects and returns the data updated in the database.
     * @param {SubjectUpdateManyAndReturnArgs} args - Arguments to update many Subjects.
     * @example
     * // Update many Subjects
     * const subject = await prisma.subject.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Subjects and only return the `id`
     * const subjectWithIdOnly = await prisma.subject.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SubjectUpdateManyAndReturnArgs>(args: SelectSubset<T, SubjectUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Subject.
     * @param {SubjectUpsertArgs} args - Arguments to update or create a Subject.
     * @example
     * // Update or create a Subject
     * const subject = await prisma.subject.upsert({
     *   create: {
     *     // ... data to create a Subject
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Subject we want to update
     *   }
     * })
     */
    upsert<T extends SubjectUpsertArgs>(args: SelectSubset<T, SubjectUpsertArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Subjects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectCountArgs} args - Arguments to filter Subjects to count.
     * @example
     * // Count the number of Subjects
     * const count = await prisma.subject.count({
     *   where: {
     *     // ... the filter for the Subjects we want to count
     *   }
     * })
    **/
    count<T extends SubjectCountArgs>(
      args?: Subset<T, SubjectCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SubjectCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Subject.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SubjectAggregateArgs>(args: Subset<T, SubjectAggregateArgs>): Prisma.PrismaPromise<GetSubjectAggregateType<T>>

    /**
     * Group by Subject.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SubjectGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubjectGroupByArgs['orderBy'] }
        : { orderBy?: SubjectGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SubjectGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubjectGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Subject model
   */
  readonly fields: SubjectFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Subject.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubjectClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    credentials<T extends Subject$credentialsArgs<ExtArgs> = {}>(args?: Subset<T, Subject$credentialsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Subject model
   */
  interface SubjectFieldRefs {
    readonly id: FieldRef<"Subject", 'String'>
    readonly name: FieldRef<"Subject", 'String'>
    readonly email: FieldRef<"Subject", 'String'>
    readonly externalIdentifier: FieldRef<"Subject", 'String'>
    readonly createdAt: FieldRef<"Subject", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Subject findUnique
   */
  export type SubjectFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subject to fetch.
     */
    where: SubjectWhereUniqueInput
  }

  /**
   * Subject findUniqueOrThrow
   */
  export type SubjectFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subject to fetch.
     */
    where: SubjectWhereUniqueInput
  }

  /**
   * Subject findFirst
   */
  export type SubjectFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subject to fetch.
     */
    where?: SubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subjects to fetch.
     */
    orderBy?: SubjectOrderByWithRelationInput | SubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subjects.
     */
    cursor?: SubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subjects.
     */
    distinct?: SubjectScalarFieldEnum | SubjectScalarFieldEnum[]
  }

  /**
   * Subject findFirstOrThrow
   */
  export type SubjectFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subject to fetch.
     */
    where?: SubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subjects to fetch.
     */
    orderBy?: SubjectOrderByWithRelationInput | SubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subjects.
     */
    cursor?: SubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subjects.
     */
    distinct?: SubjectScalarFieldEnum | SubjectScalarFieldEnum[]
  }

  /**
   * Subject findMany
   */
  export type SubjectFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subjects to fetch.
     */
    where?: SubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subjects to fetch.
     */
    orderBy?: SubjectOrderByWithRelationInput | SubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Subjects.
     */
    cursor?: SubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subjects.
     */
    distinct?: SubjectScalarFieldEnum | SubjectScalarFieldEnum[]
  }

  /**
   * Subject create
   */
  export type SubjectCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * The data needed to create a Subject.
     */
    data: XOR<SubjectCreateInput, SubjectUncheckedCreateInput>
  }

  /**
   * Subject createMany
   */
  export type SubjectCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Subjects.
     */
    data: SubjectCreateManyInput | SubjectCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subject createManyAndReturn
   */
  export type SubjectCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * The data used to create many Subjects.
     */
    data: SubjectCreateManyInput | SubjectCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subject update
   */
  export type SubjectUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * The data needed to update a Subject.
     */
    data: XOR<SubjectUpdateInput, SubjectUncheckedUpdateInput>
    /**
     * Choose, which Subject to update.
     */
    where: SubjectWhereUniqueInput
  }

  /**
   * Subject updateMany
   */
  export type SubjectUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Subjects.
     */
    data: XOR<SubjectUpdateManyMutationInput, SubjectUncheckedUpdateManyInput>
    /**
     * Filter which Subjects to update
     */
    where?: SubjectWhereInput
    /**
     * Limit how many Subjects to update.
     */
    limit?: number
  }

  /**
   * Subject updateManyAndReturn
   */
  export type SubjectUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * The data used to update Subjects.
     */
    data: XOR<SubjectUpdateManyMutationInput, SubjectUncheckedUpdateManyInput>
    /**
     * Filter which Subjects to update
     */
    where?: SubjectWhereInput
    /**
     * Limit how many Subjects to update.
     */
    limit?: number
  }

  /**
   * Subject upsert
   */
  export type SubjectUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * The filter to search for the Subject to update in case it exists.
     */
    where: SubjectWhereUniqueInput
    /**
     * In case the Subject found by the `where` argument doesn't exist, create a new Subject with this data.
     */
    create: XOR<SubjectCreateInput, SubjectUncheckedCreateInput>
    /**
     * In case the Subject was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubjectUpdateInput, SubjectUncheckedUpdateInput>
  }

  /**
   * Subject delete
   */
  export type SubjectDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter which Subject to delete.
     */
    where: SubjectWhereUniqueInput
  }

  /**
   * Subject deleteMany
   */
  export type SubjectDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subjects to delete
     */
    where?: SubjectWhereInput
    /**
     * Limit how many Subjects to delete.
     */
    limit?: number
  }

  /**
   * Subject.credentials
   */
  export type Subject$credentialsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    where?: CredentialWhereInput
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    cursor?: CredentialWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * Subject without action
   */
  export type SubjectDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
  }


  /**
   * Model Achievement
   */

  export type AggregateAchievement = {
    _count: AchievementCountAggregateOutputType | null
    _min: AchievementMinAggregateOutputType | null
    _max: AchievementMaxAggregateOutputType | null
  }

  export type AchievementMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    credentialType: $Enums.CredentialType | null
    level: string | null
    framework: string | null
  }

  export type AchievementMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    credentialType: $Enums.CredentialType | null
    level: string | null
    framework: string | null
  }

  export type AchievementCountAggregateOutputType = {
    id: number
    name: number
    description: number
    credentialType: number
    level: number
    skills: number
    framework: number
    _all: number
  }


  export type AchievementMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    credentialType?: true
    level?: true
    framework?: true
  }

  export type AchievementMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    credentialType?: true
    level?: true
    framework?: true
  }

  export type AchievementCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    credentialType?: true
    level?: true
    skills?: true
    framework?: true
    _all?: true
  }

  export type AchievementAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Achievement to aggregate.
     */
    where?: AchievementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Achievements to fetch.
     */
    orderBy?: AchievementOrderByWithRelationInput | AchievementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AchievementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Achievements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Achievements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Achievements
    **/
    _count?: true | AchievementCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AchievementMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AchievementMaxAggregateInputType
  }

  export type GetAchievementAggregateType<T extends AchievementAggregateArgs> = {
        [P in keyof T & keyof AggregateAchievement]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAchievement[P]>
      : GetScalarType<T[P], AggregateAchievement[P]>
  }




  export type AchievementGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AchievementWhereInput
    orderBy?: AchievementOrderByWithAggregationInput | AchievementOrderByWithAggregationInput[]
    by: AchievementScalarFieldEnum[] | AchievementScalarFieldEnum
    having?: AchievementScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AchievementCountAggregateInputType | true
    _min?: AchievementMinAggregateInputType
    _max?: AchievementMaxAggregateInputType
  }

  export type AchievementGroupByOutputType = {
    id: string
    name: string
    description: string | null
    credentialType: $Enums.CredentialType
    level: string | null
    skills: string[]
    framework: string | null
    _count: AchievementCountAggregateOutputType | null
    _min: AchievementMinAggregateOutputType | null
    _max: AchievementMaxAggregateOutputType | null
  }

  type GetAchievementGroupByPayload<T extends AchievementGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AchievementGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AchievementGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AchievementGroupByOutputType[P]>
            : GetScalarType<T[P], AchievementGroupByOutputType[P]>
        }
      >
    >


  export type AchievementSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    credentialType?: boolean
    level?: boolean
    skills?: boolean
    framework?: boolean
    credentials?: boolean | Achievement$credentialsArgs<ExtArgs>
    _count?: boolean | AchievementCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["achievement"]>

  export type AchievementSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    credentialType?: boolean
    level?: boolean
    skills?: boolean
    framework?: boolean
  }, ExtArgs["result"]["achievement"]>

  export type AchievementSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    credentialType?: boolean
    level?: boolean
    skills?: boolean
    framework?: boolean
  }, ExtArgs["result"]["achievement"]>

  export type AchievementSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    credentialType?: boolean
    level?: boolean
    skills?: boolean
    framework?: boolean
  }

  export type AchievementOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "description" | "credentialType" | "level" | "skills" | "framework", ExtArgs["result"]["achievement"]>
  export type AchievementInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credentials?: boolean | Achievement$credentialsArgs<ExtArgs>
    _count?: boolean | AchievementCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AchievementIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type AchievementIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AchievementPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Achievement"
    objects: {
      credentials: Prisma.$CredentialPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      credentialType: $Enums.CredentialType
      level: string | null
      skills: string[]
      framework: string | null
    }, ExtArgs["result"]["achievement"]>
    composites: {}
  }

  type AchievementGetPayload<S extends boolean | null | undefined | AchievementDefaultArgs> = $Result.GetResult<Prisma.$AchievementPayload, S>

  type AchievementCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AchievementFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AchievementCountAggregateInputType | true
    }

  export interface AchievementDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Achievement'], meta: { name: 'Achievement' } }
    /**
     * Find zero or one Achievement that matches the filter.
     * @param {AchievementFindUniqueArgs} args - Arguments to find a Achievement
     * @example
     * // Get one Achievement
     * const achievement = await prisma.achievement.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AchievementFindUniqueArgs>(args: SelectSubset<T, AchievementFindUniqueArgs<ExtArgs>>): Prisma__AchievementClient<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Achievement that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AchievementFindUniqueOrThrowArgs} args - Arguments to find a Achievement
     * @example
     * // Get one Achievement
     * const achievement = await prisma.achievement.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AchievementFindUniqueOrThrowArgs>(args: SelectSubset<T, AchievementFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AchievementClient<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Achievement that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AchievementFindFirstArgs} args - Arguments to find a Achievement
     * @example
     * // Get one Achievement
     * const achievement = await prisma.achievement.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AchievementFindFirstArgs>(args?: SelectSubset<T, AchievementFindFirstArgs<ExtArgs>>): Prisma__AchievementClient<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Achievement that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AchievementFindFirstOrThrowArgs} args - Arguments to find a Achievement
     * @example
     * // Get one Achievement
     * const achievement = await prisma.achievement.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AchievementFindFirstOrThrowArgs>(args?: SelectSubset<T, AchievementFindFirstOrThrowArgs<ExtArgs>>): Prisma__AchievementClient<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Achievements that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AchievementFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Achievements
     * const achievements = await prisma.achievement.findMany()
     * 
     * // Get first 10 Achievements
     * const achievements = await prisma.achievement.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const achievementWithIdOnly = await prisma.achievement.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AchievementFindManyArgs>(args?: SelectSubset<T, AchievementFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Achievement.
     * @param {AchievementCreateArgs} args - Arguments to create a Achievement.
     * @example
     * // Create one Achievement
     * const Achievement = await prisma.achievement.create({
     *   data: {
     *     // ... data to create a Achievement
     *   }
     * })
     * 
     */
    create<T extends AchievementCreateArgs>(args: SelectSubset<T, AchievementCreateArgs<ExtArgs>>): Prisma__AchievementClient<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Achievements.
     * @param {AchievementCreateManyArgs} args - Arguments to create many Achievements.
     * @example
     * // Create many Achievements
     * const achievement = await prisma.achievement.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AchievementCreateManyArgs>(args?: SelectSubset<T, AchievementCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Achievements and returns the data saved in the database.
     * @param {AchievementCreateManyAndReturnArgs} args - Arguments to create many Achievements.
     * @example
     * // Create many Achievements
     * const achievement = await prisma.achievement.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Achievements and only return the `id`
     * const achievementWithIdOnly = await prisma.achievement.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AchievementCreateManyAndReturnArgs>(args?: SelectSubset<T, AchievementCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Achievement.
     * @param {AchievementDeleteArgs} args - Arguments to delete one Achievement.
     * @example
     * // Delete one Achievement
     * const Achievement = await prisma.achievement.delete({
     *   where: {
     *     // ... filter to delete one Achievement
     *   }
     * })
     * 
     */
    delete<T extends AchievementDeleteArgs>(args: SelectSubset<T, AchievementDeleteArgs<ExtArgs>>): Prisma__AchievementClient<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Achievement.
     * @param {AchievementUpdateArgs} args - Arguments to update one Achievement.
     * @example
     * // Update one Achievement
     * const achievement = await prisma.achievement.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AchievementUpdateArgs>(args: SelectSubset<T, AchievementUpdateArgs<ExtArgs>>): Prisma__AchievementClient<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Achievements.
     * @param {AchievementDeleteManyArgs} args - Arguments to filter Achievements to delete.
     * @example
     * // Delete a few Achievements
     * const { count } = await prisma.achievement.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AchievementDeleteManyArgs>(args?: SelectSubset<T, AchievementDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Achievements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AchievementUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Achievements
     * const achievement = await prisma.achievement.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AchievementUpdateManyArgs>(args: SelectSubset<T, AchievementUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Achievements and returns the data updated in the database.
     * @param {AchievementUpdateManyAndReturnArgs} args - Arguments to update many Achievements.
     * @example
     * // Update many Achievements
     * const achievement = await prisma.achievement.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Achievements and only return the `id`
     * const achievementWithIdOnly = await prisma.achievement.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AchievementUpdateManyAndReturnArgs>(args: SelectSubset<T, AchievementUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Achievement.
     * @param {AchievementUpsertArgs} args - Arguments to update or create a Achievement.
     * @example
     * // Update or create a Achievement
     * const achievement = await prisma.achievement.upsert({
     *   create: {
     *     // ... data to create a Achievement
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Achievement we want to update
     *   }
     * })
     */
    upsert<T extends AchievementUpsertArgs>(args: SelectSubset<T, AchievementUpsertArgs<ExtArgs>>): Prisma__AchievementClient<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Achievements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AchievementCountArgs} args - Arguments to filter Achievements to count.
     * @example
     * // Count the number of Achievements
     * const count = await prisma.achievement.count({
     *   where: {
     *     // ... the filter for the Achievements we want to count
     *   }
     * })
    **/
    count<T extends AchievementCountArgs>(
      args?: Subset<T, AchievementCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AchievementCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Achievement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AchievementAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AchievementAggregateArgs>(args: Subset<T, AchievementAggregateArgs>): Prisma.PrismaPromise<GetAchievementAggregateType<T>>

    /**
     * Group by Achievement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AchievementGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AchievementGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AchievementGroupByArgs['orderBy'] }
        : { orderBy?: AchievementGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AchievementGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAchievementGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Achievement model
   */
  readonly fields: AchievementFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Achievement.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AchievementClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    credentials<T extends Achievement$credentialsArgs<ExtArgs> = {}>(args?: Subset<T, Achievement$credentialsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Achievement model
   */
  interface AchievementFieldRefs {
    readonly id: FieldRef<"Achievement", 'String'>
    readonly name: FieldRef<"Achievement", 'String'>
    readonly description: FieldRef<"Achievement", 'String'>
    readonly credentialType: FieldRef<"Achievement", 'CredentialType'>
    readonly level: FieldRef<"Achievement", 'String'>
    readonly skills: FieldRef<"Achievement", 'String[]'>
    readonly framework: FieldRef<"Achievement", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Achievement findUnique
   */
  export type AchievementFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
    /**
     * Filter, which Achievement to fetch.
     */
    where: AchievementWhereUniqueInput
  }

  /**
   * Achievement findUniqueOrThrow
   */
  export type AchievementFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
    /**
     * Filter, which Achievement to fetch.
     */
    where: AchievementWhereUniqueInput
  }

  /**
   * Achievement findFirst
   */
  export type AchievementFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
    /**
     * Filter, which Achievement to fetch.
     */
    where?: AchievementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Achievements to fetch.
     */
    orderBy?: AchievementOrderByWithRelationInput | AchievementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Achievements.
     */
    cursor?: AchievementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Achievements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Achievements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Achievements.
     */
    distinct?: AchievementScalarFieldEnum | AchievementScalarFieldEnum[]
  }

  /**
   * Achievement findFirstOrThrow
   */
  export type AchievementFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
    /**
     * Filter, which Achievement to fetch.
     */
    where?: AchievementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Achievements to fetch.
     */
    orderBy?: AchievementOrderByWithRelationInput | AchievementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Achievements.
     */
    cursor?: AchievementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Achievements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Achievements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Achievements.
     */
    distinct?: AchievementScalarFieldEnum | AchievementScalarFieldEnum[]
  }

  /**
   * Achievement findMany
   */
  export type AchievementFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
    /**
     * Filter, which Achievements to fetch.
     */
    where?: AchievementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Achievements to fetch.
     */
    orderBy?: AchievementOrderByWithRelationInput | AchievementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Achievements.
     */
    cursor?: AchievementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Achievements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Achievements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Achievements.
     */
    distinct?: AchievementScalarFieldEnum | AchievementScalarFieldEnum[]
  }

  /**
   * Achievement create
   */
  export type AchievementCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
    /**
     * The data needed to create a Achievement.
     */
    data: XOR<AchievementCreateInput, AchievementUncheckedCreateInput>
  }

  /**
   * Achievement createMany
   */
  export type AchievementCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Achievements.
     */
    data: AchievementCreateManyInput | AchievementCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Achievement createManyAndReturn
   */
  export type AchievementCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * The data used to create many Achievements.
     */
    data: AchievementCreateManyInput | AchievementCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Achievement update
   */
  export type AchievementUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
    /**
     * The data needed to update a Achievement.
     */
    data: XOR<AchievementUpdateInput, AchievementUncheckedUpdateInput>
    /**
     * Choose, which Achievement to update.
     */
    where: AchievementWhereUniqueInput
  }

  /**
   * Achievement updateMany
   */
  export type AchievementUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Achievements.
     */
    data: XOR<AchievementUpdateManyMutationInput, AchievementUncheckedUpdateManyInput>
    /**
     * Filter which Achievements to update
     */
    where?: AchievementWhereInput
    /**
     * Limit how many Achievements to update.
     */
    limit?: number
  }

  /**
   * Achievement updateManyAndReturn
   */
  export type AchievementUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * The data used to update Achievements.
     */
    data: XOR<AchievementUpdateManyMutationInput, AchievementUncheckedUpdateManyInput>
    /**
     * Filter which Achievements to update
     */
    where?: AchievementWhereInput
    /**
     * Limit how many Achievements to update.
     */
    limit?: number
  }

  /**
   * Achievement upsert
   */
  export type AchievementUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
    /**
     * The filter to search for the Achievement to update in case it exists.
     */
    where: AchievementWhereUniqueInput
    /**
     * In case the Achievement found by the `where` argument doesn't exist, create a new Achievement with this data.
     */
    create: XOR<AchievementCreateInput, AchievementUncheckedCreateInput>
    /**
     * In case the Achievement was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AchievementUpdateInput, AchievementUncheckedUpdateInput>
  }

  /**
   * Achievement delete
   */
  export type AchievementDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
    /**
     * Filter which Achievement to delete.
     */
    where: AchievementWhereUniqueInput
  }

  /**
   * Achievement deleteMany
   */
  export type AchievementDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Achievements to delete
     */
    where?: AchievementWhereInput
    /**
     * Limit how many Achievements to delete.
     */
    limit?: number
  }

  /**
   * Achievement.credentials
   */
  export type Achievement$credentialsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    where?: CredentialWhereInput
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    cursor?: CredentialWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * Achievement without action
   */
  export type AchievementDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Achievement
     */
    select?: AchievementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Achievement
     */
    omit?: AchievementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AchievementInclude<ExtArgs> | null
  }


  /**
   * Model Credential
   */

  export type AggregateCredential = {
    _count: CredentialCountAggregateOutputType | null
    _min: CredentialMinAggregateOutputType | null
    _max: CredentialMaxAggregateOutputType | null
  }

  export type CredentialMinAggregateOutputType = {
    id: string | null
    issuerId: string | null
    subjectId: string | null
    achievementId: string | null
    credentialType: $Enums.CredentialType | null
    issueDate: Date | null
    expirationDate: Date | null
    status: $Enums.VerificationStatus | null
    source: $Enums.CredentialInputType | null
    sourceIdentifier: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CredentialMaxAggregateOutputType = {
    id: string | null
    issuerId: string | null
    subjectId: string | null
    achievementId: string | null
    credentialType: $Enums.CredentialType | null
    issueDate: Date | null
    expirationDate: Date | null
    status: $Enums.VerificationStatus | null
    source: $Enums.CredentialInputType | null
    sourceIdentifier: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CredentialCountAggregateOutputType = {
    id: number
    issuerId: number
    subjectId: number
    achievementId: number
    credentialType: number
    issueDate: number
    expirationDate: number
    status: number
    source: number
    sourceIdentifier: number
    rawMetadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CredentialMinAggregateInputType = {
    id?: true
    issuerId?: true
    subjectId?: true
    achievementId?: true
    credentialType?: true
    issueDate?: true
    expirationDate?: true
    status?: true
    source?: true
    sourceIdentifier?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CredentialMaxAggregateInputType = {
    id?: true
    issuerId?: true
    subjectId?: true
    achievementId?: true
    credentialType?: true
    issueDate?: true
    expirationDate?: true
    status?: true
    source?: true
    sourceIdentifier?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CredentialCountAggregateInputType = {
    id?: true
    issuerId?: true
    subjectId?: true
    achievementId?: true
    credentialType?: true
    issueDate?: true
    expirationDate?: true
    status?: true
    source?: true
    sourceIdentifier?: true
    rawMetadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CredentialAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Credential to aggregate.
     */
    where?: CredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Credentials to fetch.
     */
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Credentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Credentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Credentials
    **/
    _count?: true | CredentialCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CredentialMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CredentialMaxAggregateInputType
  }

  export type GetCredentialAggregateType<T extends CredentialAggregateArgs> = {
        [P in keyof T & keyof AggregateCredential]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCredential[P]>
      : GetScalarType<T[P], AggregateCredential[P]>
  }




  export type CredentialGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CredentialWhereInput
    orderBy?: CredentialOrderByWithAggregationInput | CredentialOrderByWithAggregationInput[]
    by: CredentialScalarFieldEnum[] | CredentialScalarFieldEnum
    having?: CredentialScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CredentialCountAggregateInputType | true
    _min?: CredentialMinAggregateInputType
    _max?: CredentialMaxAggregateInputType
  }

  export type CredentialGroupByOutputType = {
    id: string
    issuerId: string
    subjectId: string
    achievementId: string
    credentialType: $Enums.CredentialType
    issueDate: Date | null
    expirationDate: Date | null
    status: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier: string | null
    rawMetadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: CredentialCountAggregateOutputType | null
    _min: CredentialMinAggregateOutputType | null
    _max: CredentialMaxAggregateOutputType | null
  }

  type GetCredentialGroupByPayload<T extends CredentialGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CredentialGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CredentialGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CredentialGroupByOutputType[P]>
            : GetScalarType<T[P], CredentialGroupByOutputType[P]>
        }
      >
    >


  export type CredentialSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    issuerId?: boolean
    subjectId?: boolean
    achievementId?: boolean
    credentialType?: boolean
    issueDate?: boolean
    expirationDate?: boolean
    status?: boolean
    source?: boolean
    sourceIdentifier?: boolean
    rawMetadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    issuer?: boolean | IssuerDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
    achievement?: boolean | AchievementDefaultArgs<ExtArgs>
    verifications?: boolean | Credential$verificationsArgs<ExtArgs>
    _count?: boolean | CredentialCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["credential"]>

  export type CredentialSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    issuerId?: boolean
    subjectId?: boolean
    achievementId?: boolean
    credentialType?: boolean
    issueDate?: boolean
    expirationDate?: boolean
    status?: boolean
    source?: boolean
    sourceIdentifier?: boolean
    rawMetadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    issuer?: boolean | IssuerDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
    achievement?: boolean | AchievementDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["credential"]>

  export type CredentialSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    issuerId?: boolean
    subjectId?: boolean
    achievementId?: boolean
    credentialType?: boolean
    issueDate?: boolean
    expirationDate?: boolean
    status?: boolean
    source?: boolean
    sourceIdentifier?: boolean
    rawMetadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    issuer?: boolean | IssuerDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
    achievement?: boolean | AchievementDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["credential"]>

  export type CredentialSelectScalar = {
    id?: boolean
    issuerId?: boolean
    subjectId?: boolean
    achievementId?: boolean
    credentialType?: boolean
    issueDate?: boolean
    expirationDate?: boolean
    status?: boolean
    source?: boolean
    sourceIdentifier?: boolean
    rawMetadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CredentialOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "issuerId" | "subjectId" | "achievementId" | "credentialType" | "issueDate" | "expirationDate" | "status" | "source" | "sourceIdentifier" | "rawMetadata" | "createdAt" | "updatedAt", ExtArgs["result"]["credential"]>
  export type CredentialInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    issuer?: boolean | IssuerDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
    achievement?: boolean | AchievementDefaultArgs<ExtArgs>
    verifications?: boolean | Credential$verificationsArgs<ExtArgs>
    _count?: boolean | CredentialCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CredentialIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    issuer?: boolean | IssuerDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
    achievement?: boolean | AchievementDefaultArgs<ExtArgs>
  }
  export type CredentialIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    issuer?: boolean | IssuerDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
    achievement?: boolean | AchievementDefaultArgs<ExtArgs>
  }

  export type $CredentialPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Credential"
    objects: {
      issuer: Prisma.$IssuerPayload<ExtArgs>
      subject: Prisma.$SubjectPayload<ExtArgs>
      achievement: Prisma.$AchievementPayload<ExtArgs>
      verifications: Prisma.$VerificationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      issuerId: string
      subjectId: string
      achievementId: string
      credentialType: $Enums.CredentialType
      issueDate: Date | null
      expirationDate: Date | null
      status: $Enums.VerificationStatus
      source: $Enums.CredentialInputType
      sourceIdentifier: string | null
      rawMetadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["credential"]>
    composites: {}
  }

  type CredentialGetPayload<S extends boolean | null | undefined | CredentialDefaultArgs> = $Result.GetResult<Prisma.$CredentialPayload, S>

  type CredentialCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CredentialFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CredentialCountAggregateInputType | true
    }

  export interface CredentialDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Credential'], meta: { name: 'Credential' } }
    /**
     * Find zero or one Credential that matches the filter.
     * @param {CredentialFindUniqueArgs} args - Arguments to find a Credential
     * @example
     * // Get one Credential
     * const credential = await prisma.credential.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CredentialFindUniqueArgs>(args: SelectSubset<T, CredentialFindUniqueArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Credential that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CredentialFindUniqueOrThrowArgs} args - Arguments to find a Credential
     * @example
     * // Get one Credential
     * const credential = await prisma.credential.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CredentialFindUniqueOrThrowArgs>(args: SelectSubset<T, CredentialFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Credential that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialFindFirstArgs} args - Arguments to find a Credential
     * @example
     * // Get one Credential
     * const credential = await prisma.credential.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CredentialFindFirstArgs>(args?: SelectSubset<T, CredentialFindFirstArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Credential that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialFindFirstOrThrowArgs} args - Arguments to find a Credential
     * @example
     * // Get one Credential
     * const credential = await prisma.credential.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CredentialFindFirstOrThrowArgs>(args?: SelectSubset<T, CredentialFindFirstOrThrowArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Credentials that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Credentials
     * const credentials = await prisma.credential.findMany()
     * 
     * // Get first 10 Credentials
     * const credentials = await prisma.credential.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const credentialWithIdOnly = await prisma.credential.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CredentialFindManyArgs>(args?: SelectSubset<T, CredentialFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Credential.
     * @param {CredentialCreateArgs} args - Arguments to create a Credential.
     * @example
     * // Create one Credential
     * const Credential = await prisma.credential.create({
     *   data: {
     *     // ... data to create a Credential
     *   }
     * })
     * 
     */
    create<T extends CredentialCreateArgs>(args: SelectSubset<T, CredentialCreateArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Credentials.
     * @param {CredentialCreateManyArgs} args - Arguments to create many Credentials.
     * @example
     * // Create many Credentials
     * const credential = await prisma.credential.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CredentialCreateManyArgs>(args?: SelectSubset<T, CredentialCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Credentials and returns the data saved in the database.
     * @param {CredentialCreateManyAndReturnArgs} args - Arguments to create many Credentials.
     * @example
     * // Create many Credentials
     * const credential = await prisma.credential.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Credentials and only return the `id`
     * const credentialWithIdOnly = await prisma.credential.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CredentialCreateManyAndReturnArgs>(args?: SelectSubset<T, CredentialCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Credential.
     * @param {CredentialDeleteArgs} args - Arguments to delete one Credential.
     * @example
     * // Delete one Credential
     * const Credential = await prisma.credential.delete({
     *   where: {
     *     // ... filter to delete one Credential
     *   }
     * })
     * 
     */
    delete<T extends CredentialDeleteArgs>(args: SelectSubset<T, CredentialDeleteArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Credential.
     * @param {CredentialUpdateArgs} args - Arguments to update one Credential.
     * @example
     * // Update one Credential
     * const credential = await prisma.credential.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CredentialUpdateArgs>(args: SelectSubset<T, CredentialUpdateArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Credentials.
     * @param {CredentialDeleteManyArgs} args - Arguments to filter Credentials to delete.
     * @example
     * // Delete a few Credentials
     * const { count } = await prisma.credential.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CredentialDeleteManyArgs>(args?: SelectSubset<T, CredentialDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Credentials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Credentials
     * const credential = await prisma.credential.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CredentialUpdateManyArgs>(args: SelectSubset<T, CredentialUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Credentials and returns the data updated in the database.
     * @param {CredentialUpdateManyAndReturnArgs} args - Arguments to update many Credentials.
     * @example
     * // Update many Credentials
     * const credential = await prisma.credential.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Credentials and only return the `id`
     * const credentialWithIdOnly = await prisma.credential.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CredentialUpdateManyAndReturnArgs>(args: SelectSubset<T, CredentialUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Credential.
     * @param {CredentialUpsertArgs} args - Arguments to update or create a Credential.
     * @example
     * // Update or create a Credential
     * const credential = await prisma.credential.upsert({
     *   create: {
     *     // ... data to create a Credential
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Credential we want to update
     *   }
     * })
     */
    upsert<T extends CredentialUpsertArgs>(args: SelectSubset<T, CredentialUpsertArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Credentials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialCountArgs} args - Arguments to filter Credentials to count.
     * @example
     * // Count the number of Credentials
     * const count = await prisma.credential.count({
     *   where: {
     *     // ... the filter for the Credentials we want to count
     *   }
     * })
    **/
    count<T extends CredentialCountArgs>(
      args?: Subset<T, CredentialCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CredentialCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Credential.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CredentialAggregateArgs>(args: Subset<T, CredentialAggregateArgs>): Prisma.PrismaPromise<GetCredentialAggregateType<T>>

    /**
     * Group by Credential.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CredentialGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CredentialGroupByArgs['orderBy'] }
        : { orderBy?: CredentialGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CredentialGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCredentialGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Credential model
   */
  readonly fields: CredentialFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Credential.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CredentialClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    issuer<T extends IssuerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IssuerDefaultArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    subject<T extends SubjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SubjectDefaultArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    achievement<T extends AchievementDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AchievementDefaultArgs<ExtArgs>>): Prisma__AchievementClient<$Result.GetResult<Prisma.$AchievementPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    verifications<T extends Credential$verificationsArgs<ExtArgs> = {}>(args?: Subset<T, Credential$verificationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Credential model
   */
  interface CredentialFieldRefs {
    readonly id: FieldRef<"Credential", 'String'>
    readonly issuerId: FieldRef<"Credential", 'String'>
    readonly subjectId: FieldRef<"Credential", 'String'>
    readonly achievementId: FieldRef<"Credential", 'String'>
    readonly credentialType: FieldRef<"Credential", 'CredentialType'>
    readonly issueDate: FieldRef<"Credential", 'DateTime'>
    readonly expirationDate: FieldRef<"Credential", 'DateTime'>
    readonly status: FieldRef<"Credential", 'VerificationStatus'>
    readonly source: FieldRef<"Credential", 'CredentialInputType'>
    readonly sourceIdentifier: FieldRef<"Credential", 'String'>
    readonly rawMetadata: FieldRef<"Credential", 'Json'>
    readonly createdAt: FieldRef<"Credential", 'DateTime'>
    readonly updatedAt: FieldRef<"Credential", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Credential findUnique
   */
  export type CredentialFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credential to fetch.
     */
    where: CredentialWhereUniqueInput
  }

  /**
   * Credential findUniqueOrThrow
   */
  export type CredentialFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credential to fetch.
     */
    where: CredentialWhereUniqueInput
  }

  /**
   * Credential findFirst
   */
  export type CredentialFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credential to fetch.
     */
    where?: CredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Credentials to fetch.
     */
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Credentials.
     */
    cursor?: CredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Credentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Credentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Credentials.
     */
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * Credential findFirstOrThrow
   */
  export type CredentialFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credential to fetch.
     */
    where?: CredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Credentials to fetch.
     */
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Credentials.
     */
    cursor?: CredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Credentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Credentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Credentials.
     */
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * Credential findMany
   */
  export type CredentialFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credentials to fetch.
     */
    where?: CredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Credentials to fetch.
     */
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Credentials.
     */
    cursor?: CredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Credentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Credentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Credentials.
     */
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * Credential create
   */
  export type CredentialCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * The data needed to create a Credential.
     */
    data: XOR<CredentialCreateInput, CredentialUncheckedCreateInput>
  }

  /**
   * Credential createMany
   */
  export type CredentialCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Credentials.
     */
    data: CredentialCreateManyInput | CredentialCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Credential createManyAndReturn
   */
  export type CredentialCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * The data used to create many Credentials.
     */
    data: CredentialCreateManyInput | CredentialCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Credential update
   */
  export type CredentialUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * The data needed to update a Credential.
     */
    data: XOR<CredentialUpdateInput, CredentialUncheckedUpdateInput>
    /**
     * Choose, which Credential to update.
     */
    where: CredentialWhereUniqueInput
  }

  /**
   * Credential updateMany
   */
  export type CredentialUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Credentials.
     */
    data: XOR<CredentialUpdateManyMutationInput, CredentialUncheckedUpdateManyInput>
    /**
     * Filter which Credentials to update
     */
    where?: CredentialWhereInput
    /**
     * Limit how many Credentials to update.
     */
    limit?: number
  }

  /**
   * Credential updateManyAndReturn
   */
  export type CredentialUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * The data used to update Credentials.
     */
    data: XOR<CredentialUpdateManyMutationInput, CredentialUncheckedUpdateManyInput>
    /**
     * Filter which Credentials to update
     */
    where?: CredentialWhereInput
    /**
     * Limit how many Credentials to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Credential upsert
   */
  export type CredentialUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * The filter to search for the Credential to update in case it exists.
     */
    where: CredentialWhereUniqueInput
    /**
     * In case the Credential found by the `where` argument doesn't exist, create a new Credential with this data.
     */
    create: XOR<CredentialCreateInput, CredentialUncheckedCreateInput>
    /**
     * In case the Credential was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CredentialUpdateInput, CredentialUncheckedUpdateInput>
  }

  /**
   * Credential delete
   */
  export type CredentialDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter which Credential to delete.
     */
    where: CredentialWhereUniqueInput
  }

  /**
   * Credential deleteMany
   */
  export type CredentialDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Credentials to delete
     */
    where?: CredentialWhereInput
    /**
     * Limit how many Credentials to delete.
     */
    limit?: number
  }

  /**
   * Credential.verifications
   */
  export type Credential$verificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    where?: VerificationWhereInput
    orderBy?: VerificationOrderByWithRelationInput | VerificationOrderByWithRelationInput[]
    cursor?: VerificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VerificationScalarFieldEnum | VerificationScalarFieldEnum[]
  }

  /**
   * Credential without action
   */
  export type CredentialDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
  }


  /**
   * Model Verification
   */

  export type AggregateVerification = {
    _count: VerificationCountAggregateOutputType | null
    _min: VerificationMinAggregateOutputType | null
    _max: VerificationMaxAggregateOutputType | null
  }

  export type VerificationMinAggregateOutputType = {
    id: string | null
    credentialId: string | null
    method: $Enums.VerificationMethod | null
    provider: string | null
    verificationLevel: $Enums.VerificationLevel | null
    verifiedAt: Date | null
    adapterVersion: string | null
    evidenceUrl: string | null
    createdAt: Date | null
  }

  export type VerificationMaxAggregateOutputType = {
    id: string | null
    credentialId: string | null
    method: $Enums.VerificationMethod | null
    provider: string | null
    verificationLevel: $Enums.VerificationLevel | null
    verifiedAt: Date | null
    adapterVersion: string | null
    evidenceUrl: string | null
    createdAt: Date | null
  }

  export type VerificationCountAggregateOutputType = {
    id: number
    credentialId: number
    method: number
    provider: number
    verificationLevel: number
    verifiedAt: number
    adapterVersion: number
    evidenceUrl: number
    rawResponse: number
    createdAt: number
    _all: number
  }


  export type VerificationMinAggregateInputType = {
    id?: true
    credentialId?: true
    method?: true
    provider?: true
    verificationLevel?: true
    verifiedAt?: true
    adapterVersion?: true
    evidenceUrl?: true
    createdAt?: true
  }

  export type VerificationMaxAggregateInputType = {
    id?: true
    credentialId?: true
    method?: true
    provider?: true
    verificationLevel?: true
    verifiedAt?: true
    adapterVersion?: true
    evidenceUrl?: true
    createdAt?: true
  }

  export type VerificationCountAggregateInputType = {
    id?: true
    credentialId?: true
    method?: true
    provider?: true
    verificationLevel?: true
    verifiedAt?: true
    adapterVersion?: true
    evidenceUrl?: true
    rawResponse?: true
    createdAt?: true
    _all?: true
  }

  export type VerificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Verification to aggregate.
     */
    where?: VerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Verifications to fetch.
     */
    orderBy?: VerificationOrderByWithRelationInput | VerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Verifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Verifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Verifications
    **/
    _count?: true | VerificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationMaxAggregateInputType
  }

  export type GetVerificationAggregateType<T extends VerificationAggregateArgs> = {
        [P in keyof T & keyof AggregateVerification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerification[P]>
      : GetScalarType<T[P], AggregateVerification[P]>
  }




  export type VerificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationWhereInput
    orderBy?: VerificationOrderByWithAggregationInput | VerificationOrderByWithAggregationInput[]
    by: VerificationScalarFieldEnum[] | VerificationScalarFieldEnum
    having?: VerificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationCountAggregateInputType | true
    _min?: VerificationMinAggregateInputType
    _max?: VerificationMaxAggregateInputType
  }

  export type VerificationGroupByOutputType = {
    id: string
    credentialId: string
    method: $Enums.VerificationMethod
    provider: string | null
    verificationLevel: $Enums.VerificationLevel
    verifiedAt: Date | null
    adapterVersion: string
    evidenceUrl: string | null
    rawResponse: JsonValue | null
    createdAt: Date
    _count: VerificationCountAggregateOutputType | null
    _min: VerificationMinAggregateOutputType | null
    _max: VerificationMaxAggregateOutputType | null
  }

  type GetVerificationGroupByPayload<T extends VerificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationGroupByOutputType[P]>
        }
      >
    >


  export type VerificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    credentialId?: boolean
    method?: boolean
    provider?: boolean
    verificationLevel?: boolean
    verifiedAt?: boolean
    adapterVersion?: boolean
    evidenceUrl?: boolean
    rawResponse?: boolean
    createdAt?: boolean
    credential?: boolean | CredentialDefaultArgs<ExtArgs>
    checks?: boolean | Verification$checksArgs<ExtArgs>
    evidence?: boolean | Verification$evidenceArgs<ExtArgs>
    attempts?: boolean | Verification$attemptsArgs<ExtArgs>
    _count?: boolean | VerificationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verification"]>

  export type VerificationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    credentialId?: boolean
    method?: boolean
    provider?: boolean
    verificationLevel?: boolean
    verifiedAt?: boolean
    adapterVersion?: boolean
    evidenceUrl?: boolean
    rawResponse?: boolean
    createdAt?: boolean
    credential?: boolean | CredentialDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verification"]>

  export type VerificationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    credentialId?: boolean
    method?: boolean
    provider?: boolean
    verificationLevel?: boolean
    verifiedAt?: boolean
    adapterVersion?: boolean
    evidenceUrl?: boolean
    rawResponse?: boolean
    createdAt?: boolean
    credential?: boolean | CredentialDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verification"]>

  export type VerificationSelectScalar = {
    id?: boolean
    credentialId?: boolean
    method?: boolean
    provider?: boolean
    verificationLevel?: boolean
    verifiedAt?: boolean
    adapterVersion?: boolean
    evidenceUrl?: boolean
    rawResponse?: boolean
    createdAt?: boolean
  }

  export type VerificationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "credentialId" | "method" | "provider" | "verificationLevel" | "verifiedAt" | "adapterVersion" | "evidenceUrl" | "rawResponse" | "createdAt", ExtArgs["result"]["verification"]>
  export type VerificationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credential?: boolean | CredentialDefaultArgs<ExtArgs>
    checks?: boolean | Verification$checksArgs<ExtArgs>
    evidence?: boolean | Verification$evidenceArgs<ExtArgs>
    attempts?: boolean | Verification$attemptsArgs<ExtArgs>
    _count?: boolean | VerificationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type VerificationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credential?: boolean | CredentialDefaultArgs<ExtArgs>
  }
  export type VerificationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credential?: boolean | CredentialDefaultArgs<ExtArgs>
  }

  export type $VerificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Verification"
    objects: {
      credential: Prisma.$CredentialPayload<ExtArgs>
      checks: Prisma.$VerificationCheckPayload<ExtArgs>[]
      evidence: Prisma.$VerificationEvidencePayload<ExtArgs>[]
      attempts: Prisma.$VerificationAttemptPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      credentialId: string
      method: $Enums.VerificationMethod
      provider: string | null
      verificationLevel: $Enums.VerificationLevel
      verifiedAt: Date | null
      adapterVersion: string
      evidenceUrl: string | null
      rawResponse: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["verification"]>
    composites: {}
  }

  type VerificationGetPayload<S extends boolean | null | undefined | VerificationDefaultArgs> = $Result.GetResult<Prisma.$VerificationPayload, S>

  type VerificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationCountAggregateInputType | true
    }

  export interface VerificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Verification'], meta: { name: 'Verification' } }
    /**
     * Find zero or one Verification that matches the filter.
     * @param {VerificationFindUniqueArgs} args - Arguments to find a Verification
     * @example
     * // Get one Verification
     * const verification = await prisma.verification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationFindUniqueArgs>(args: SelectSubset<T, VerificationFindUniqueArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Verification that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationFindUniqueOrThrowArgs} args - Arguments to find a Verification
     * @example
     * // Get one Verification
     * const verification = await prisma.verification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Verification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationFindFirstArgs} args - Arguments to find a Verification
     * @example
     * // Get one Verification
     * const verification = await prisma.verification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationFindFirstArgs>(args?: SelectSubset<T, VerificationFindFirstArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Verification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationFindFirstOrThrowArgs} args - Arguments to find a Verification
     * @example
     * // Get one Verification
     * const verification = await prisma.verification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Verifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Verifications
     * const verifications = await prisma.verification.findMany()
     * 
     * // Get first 10 Verifications
     * const verifications = await prisma.verification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const verificationWithIdOnly = await prisma.verification.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VerificationFindManyArgs>(args?: SelectSubset<T, VerificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Verification.
     * @param {VerificationCreateArgs} args - Arguments to create a Verification.
     * @example
     * // Create one Verification
     * const Verification = await prisma.verification.create({
     *   data: {
     *     // ... data to create a Verification
     *   }
     * })
     * 
     */
    create<T extends VerificationCreateArgs>(args: SelectSubset<T, VerificationCreateArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Verifications.
     * @param {VerificationCreateManyArgs} args - Arguments to create many Verifications.
     * @example
     * // Create many Verifications
     * const verification = await prisma.verification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationCreateManyArgs>(args?: SelectSubset<T, VerificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Verifications and returns the data saved in the database.
     * @param {VerificationCreateManyAndReturnArgs} args - Arguments to create many Verifications.
     * @example
     * // Create many Verifications
     * const verification = await prisma.verification.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Verifications and only return the `id`
     * const verificationWithIdOnly = await prisma.verification.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Verification.
     * @param {VerificationDeleteArgs} args - Arguments to delete one Verification.
     * @example
     * // Delete one Verification
     * const Verification = await prisma.verification.delete({
     *   where: {
     *     // ... filter to delete one Verification
     *   }
     * })
     * 
     */
    delete<T extends VerificationDeleteArgs>(args: SelectSubset<T, VerificationDeleteArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Verification.
     * @param {VerificationUpdateArgs} args - Arguments to update one Verification.
     * @example
     * // Update one Verification
     * const verification = await prisma.verification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationUpdateArgs>(args: SelectSubset<T, VerificationUpdateArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Verifications.
     * @param {VerificationDeleteManyArgs} args - Arguments to filter Verifications to delete.
     * @example
     * // Delete a few Verifications
     * const { count } = await prisma.verification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationDeleteManyArgs>(args?: SelectSubset<T, VerificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Verifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Verifications
     * const verification = await prisma.verification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationUpdateManyArgs>(args: SelectSubset<T, VerificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Verifications and returns the data updated in the database.
     * @param {VerificationUpdateManyAndReturnArgs} args - Arguments to update many Verifications.
     * @example
     * // Update many Verifications
     * const verification = await prisma.verification.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Verifications and only return the `id`
     * const verificationWithIdOnly = await prisma.verification.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VerificationUpdateManyAndReturnArgs>(args: SelectSubset<T, VerificationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Verification.
     * @param {VerificationUpsertArgs} args - Arguments to update or create a Verification.
     * @example
     * // Update or create a Verification
     * const verification = await prisma.verification.upsert({
     *   create: {
     *     // ... data to create a Verification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Verification we want to update
     *   }
     * })
     */
    upsert<T extends VerificationUpsertArgs>(args: SelectSubset<T, VerificationUpsertArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Verifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCountArgs} args - Arguments to filter Verifications to count.
     * @example
     * // Count the number of Verifications
     * const count = await prisma.verification.count({
     *   where: {
     *     // ... the filter for the Verifications we want to count
     *   }
     * })
    **/
    count<T extends VerificationCountArgs>(
      args?: Subset<T, VerificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Verification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationAggregateArgs>(args: Subset<T, VerificationAggregateArgs>): Prisma.PrismaPromise<GetVerificationAggregateType<T>>

    /**
     * Group by Verification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VerificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationGroupByArgs['orderBy'] }
        : { orderBy?: VerificationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Verification model
   */
  readonly fields: VerificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Verification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    credential<T extends CredentialDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CredentialDefaultArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    checks<T extends Verification$checksArgs<ExtArgs> = {}>(args?: Subset<T, Verification$checksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    evidence<T extends Verification$evidenceArgs<ExtArgs> = {}>(args?: Subset<T, Verification$evidenceArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    attempts<T extends Verification$attemptsArgs<ExtArgs> = {}>(args?: Subset<T, Verification$attemptsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Verification model
   */
  interface VerificationFieldRefs {
    readonly id: FieldRef<"Verification", 'String'>
    readonly credentialId: FieldRef<"Verification", 'String'>
    readonly method: FieldRef<"Verification", 'VerificationMethod'>
    readonly provider: FieldRef<"Verification", 'String'>
    readonly verificationLevel: FieldRef<"Verification", 'VerificationLevel'>
    readonly verifiedAt: FieldRef<"Verification", 'DateTime'>
    readonly adapterVersion: FieldRef<"Verification", 'String'>
    readonly evidenceUrl: FieldRef<"Verification", 'String'>
    readonly rawResponse: FieldRef<"Verification", 'Json'>
    readonly createdAt: FieldRef<"Verification", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Verification findUnique
   */
  export type VerificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    /**
     * Filter, which Verification to fetch.
     */
    where: VerificationWhereUniqueInput
  }

  /**
   * Verification findUniqueOrThrow
   */
  export type VerificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    /**
     * Filter, which Verification to fetch.
     */
    where: VerificationWhereUniqueInput
  }

  /**
   * Verification findFirst
   */
  export type VerificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    /**
     * Filter, which Verification to fetch.
     */
    where?: VerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Verifications to fetch.
     */
    orderBy?: VerificationOrderByWithRelationInput | VerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Verifications.
     */
    cursor?: VerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Verifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Verifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Verifications.
     */
    distinct?: VerificationScalarFieldEnum | VerificationScalarFieldEnum[]
  }

  /**
   * Verification findFirstOrThrow
   */
  export type VerificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    /**
     * Filter, which Verification to fetch.
     */
    where?: VerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Verifications to fetch.
     */
    orderBy?: VerificationOrderByWithRelationInput | VerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Verifications.
     */
    cursor?: VerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Verifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Verifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Verifications.
     */
    distinct?: VerificationScalarFieldEnum | VerificationScalarFieldEnum[]
  }

  /**
   * Verification findMany
   */
  export type VerificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    /**
     * Filter, which Verifications to fetch.
     */
    where?: VerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Verifications to fetch.
     */
    orderBy?: VerificationOrderByWithRelationInput | VerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Verifications.
     */
    cursor?: VerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Verifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Verifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Verifications.
     */
    distinct?: VerificationScalarFieldEnum | VerificationScalarFieldEnum[]
  }

  /**
   * Verification create
   */
  export type VerificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    /**
     * The data needed to create a Verification.
     */
    data: XOR<VerificationCreateInput, VerificationUncheckedCreateInput>
  }

  /**
   * Verification createMany
   */
  export type VerificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Verifications.
     */
    data: VerificationCreateManyInput | VerificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Verification createManyAndReturn
   */
  export type VerificationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * The data used to create many Verifications.
     */
    data: VerificationCreateManyInput | VerificationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Verification update
   */
  export type VerificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    /**
     * The data needed to update a Verification.
     */
    data: XOR<VerificationUpdateInput, VerificationUncheckedUpdateInput>
    /**
     * Choose, which Verification to update.
     */
    where: VerificationWhereUniqueInput
  }

  /**
   * Verification updateMany
   */
  export type VerificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Verifications.
     */
    data: XOR<VerificationUpdateManyMutationInput, VerificationUncheckedUpdateManyInput>
    /**
     * Filter which Verifications to update
     */
    where?: VerificationWhereInput
    /**
     * Limit how many Verifications to update.
     */
    limit?: number
  }

  /**
   * Verification updateManyAndReturn
   */
  export type VerificationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * The data used to update Verifications.
     */
    data: XOR<VerificationUpdateManyMutationInput, VerificationUncheckedUpdateManyInput>
    /**
     * Filter which Verifications to update
     */
    where?: VerificationWhereInput
    /**
     * Limit how many Verifications to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Verification upsert
   */
  export type VerificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    /**
     * The filter to search for the Verification to update in case it exists.
     */
    where: VerificationWhereUniqueInput
    /**
     * In case the Verification found by the `where` argument doesn't exist, create a new Verification with this data.
     */
    create: XOR<VerificationCreateInput, VerificationUncheckedCreateInput>
    /**
     * In case the Verification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationUpdateInput, VerificationUncheckedUpdateInput>
  }

  /**
   * Verification delete
   */
  export type VerificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
    /**
     * Filter which Verification to delete.
     */
    where: VerificationWhereUniqueInput
  }

  /**
   * Verification deleteMany
   */
  export type VerificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Verifications to delete
     */
    where?: VerificationWhereInput
    /**
     * Limit how many Verifications to delete.
     */
    limit?: number
  }

  /**
   * Verification.checks
   */
  export type Verification$checksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    where?: VerificationCheckWhereInput
    orderBy?: VerificationCheckOrderByWithRelationInput | VerificationCheckOrderByWithRelationInput[]
    cursor?: VerificationCheckWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VerificationCheckScalarFieldEnum | VerificationCheckScalarFieldEnum[]
  }

  /**
   * Verification.evidence
   */
  export type Verification$evidenceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    where?: VerificationEvidenceWhereInput
    orderBy?: VerificationEvidenceOrderByWithRelationInput | VerificationEvidenceOrderByWithRelationInput[]
    cursor?: VerificationEvidenceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VerificationEvidenceScalarFieldEnum | VerificationEvidenceScalarFieldEnum[]
  }

  /**
   * Verification.attempts
   */
  export type Verification$attemptsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    where?: VerificationAttemptWhereInput
    orderBy?: VerificationAttemptOrderByWithRelationInput | VerificationAttemptOrderByWithRelationInput[]
    cursor?: VerificationAttemptWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VerificationAttemptScalarFieldEnum | VerificationAttemptScalarFieldEnum[]
  }

  /**
   * Verification without action
   */
  export type VerificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationInclude<ExtArgs> | null
  }


  /**
   * Model VerificationCheck
   */

  export type AggregateVerificationCheck = {
    _count: VerificationCheckCountAggregateOutputType | null
    _min: VerificationCheckMinAggregateOutputType | null
    _max: VerificationCheckMaxAggregateOutputType | null
  }

  export type VerificationCheckMinAggregateOutputType = {
    id: string | null
    verificationId: string | null
    checkName: string | null
    result: $Enums.CheckResult | null
    detail: string | null
  }

  export type VerificationCheckMaxAggregateOutputType = {
    id: string | null
    verificationId: string | null
    checkName: string | null
    result: $Enums.CheckResult | null
    detail: string | null
  }

  export type VerificationCheckCountAggregateOutputType = {
    id: number
    verificationId: number
    checkName: number
    result: number
    detail: number
    _all: number
  }


  export type VerificationCheckMinAggregateInputType = {
    id?: true
    verificationId?: true
    checkName?: true
    result?: true
    detail?: true
  }

  export type VerificationCheckMaxAggregateInputType = {
    id?: true
    verificationId?: true
    checkName?: true
    result?: true
    detail?: true
  }

  export type VerificationCheckCountAggregateInputType = {
    id?: true
    verificationId?: true
    checkName?: true
    result?: true
    detail?: true
    _all?: true
  }

  export type VerificationCheckAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationCheck to aggregate.
     */
    where?: VerificationCheckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationChecks to fetch.
     */
    orderBy?: VerificationCheckOrderByWithRelationInput | VerificationCheckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationCheckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationChecks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationChecks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VerificationChecks
    **/
    _count?: true | VerificationCheckCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationCheckMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationCheckMaxAggregateInputType
  }

  export type GetVerificationCheckAggregateType<T extends VerificationCheckAggregateArgs> = {
        [P in keyof T & keyof AggregateVerificationCheck]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerificationCheck[P]>
      : GetScalarType<T[P], AggregateVerificationCheck[P]>
  }




  export type VerificationCheckGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationCheckWhereInput
    orderBy?: VerificationCheckOrderByWithAggregationInput | VerificationCheckOrderByWithAggregationInput[]
    by: VerificationCheckScalarFieldEnum[] | VerificationCheckScalarFieldEnum
    having?: VerificationCheckScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationCheckCountAggregateInputType | true
    _min?: VerificationCheckMinAggregateInputType
    _max?: VerificationCheckMaxAggregateInputType
  }

  export type VerificationCheckGroupByOutputType = {
    id: string
    verificationId: string
    checkName: string
    result: $Enums.CheckResult
    detail: string | null
    _count: VerificationCheckCountAggregateOutputType | null
    _min: VerificationCheckMinAggregateOutputType | null
    _max: VerificationCheckMaxAggregateOutputType | null
  }

  type GetVerificationCheckGroupByPayload<T extends VerificationCheckGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationCheckGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationCheckGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationCheckGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationCheckGroupByOutputType[P]>
        }
      >
    >


  export type VerificationCheckSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    verificationId?: boolean
    checkName?: boolean
    result?: boolean
    detail?: boolean
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationCheck"]>

  export type VerificationCheckSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    verificationId?: boolean
    checkName?: boolean
    result?: boolean
    detail?: boolean
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationCheck"]>

  export type VerificationCheckSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    verificationId?: boolean
    checkName?: boolean
    result?: boolean
    detail?: boolean
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationCheck"]>

  export type VerificationCheckSelectScalar = {
    id?: boolean
    verificationId?: boolean
    checkName?: boolean
    result?: boolean
    detail?: boolean
  }

  export type VerificationCheckOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "verificationId" | "checkName" | "result" | "detail", ExtArgs["result"]["verificationCheck"]>
  export type VerificationCheckInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }
  export type VerificationCheckIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }
  export type VerificationCheckIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }

  export type $VerificationCheckPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VerificationCheck"
    objects: {
      verification: Prisma.$VerificationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      verificationId: string
      checkName: string
      result: $Enums.CheckResult
      detail: string | null
    }, ExtArgs["result"]["verificationCheck"]>
    composites: {}
  }

  type VerificationCheckGetPayload<S extends boolean | null | undefined | VerificationCheckDefaultArgs> = $Result.GetResult<Prisma.$VerificationCheckPayload, S>

  type VerificationCheckCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationCheckFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationCheckCountAggregateInputType | true
    }

  export interface VerificationCheckDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VerificationCheck'], meta: { name: 'VerificationCheck' } }
    /**
     * Find zero or one VerificationCheck that matches the filter.
     * @param {VerificationCheckFindUniqueArgs} args - Arguments to find a VerificationCheck
     * @example
     * // Get one VerificationCheck
     * const verificationCheck = await prisma.verificationCheck.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationCheckFindUniqueArgs>(args: SelectSubset<T, VerificationCheckFindUniqueArgs<ExtArgs>>): Prisma__VerificationCheckClient<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VerificationCheck that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationCheckFindUniqueOrThrowArgs} args - Arguments to find a VerificationCheck
     * @example
     * // Get one VerificationCheck
     * const verificationCheck = await prisma.verificationCheck.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationCheckFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationCheckFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationCheckClient<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationCheck that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCheckFindFirstArgs} args - Arguments to find a VerificationCheck
     * @example
     * // Get one VerificationCheck
     * const verificationCheck = await prisma.verificationCheck.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationCheckFindFirstArgs>(args?: SelectSubset<T, VerificationCheckFindFirstArgs<ExtArgs>>): Prisma__VerificationCheckClient<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationCheck that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCheckFindFirstOrThrowArgs} args - Arguments to find a VerificationCheck
     * @example
     * // Get one VerificationCheck
     * const verificationCheck = await prisma.verificationCheck.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationCheckFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationCheckFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationCheckClient<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VerificationChecks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCheckFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VerificationChecks
     * const verificationChecks = await prisma.verificationCheck.findMany()
     * 
     * // Get first 10 VerificationChecks
     * const verificationChecks = await prisma.verificationCheck.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const verificationCheckWithIdOnly = await prisma.verificationCheck.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VerificationCheckFindManyArgs>(args?: SelectSubset<T, VerificationCheckFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VerificationCheck.
     * @param {VerificationCheckCreateArgs} args - Arguments to create a VerificationCheck.
     * @example
     * // Create one VerificationCheck
     * const VerificationCheck = await prisma.verificationCheck.create({
     *   data: {
     *     // ... data to create a VerificationCheck
     *   }
     * })
     * 
     */
    create<T extends VerificationCheckCreateArgs>(args: SelectSubset<T, VerificationCheckCreateArgs<ExtArgs>>): Prisma__VerificationCheckClient<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VerificationChecks.
     * @param {VerificationCheckCreateManyArgs} args - Arguments to create many VerificationChecks.
     * @example
     * // Create many VerificationChecks
     * const verificationCheck = await prisma.verificationCheck.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationCheckCreateManyArgs>(args?: SelectSubset<T, VerificationCheckCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VerificationChecks and returns the data saved in the database.
     * @param {VerificationCheckCreateManyAndReturnArgs} args - Arguments to create many VerificationChecks.
     * @example
     * // Create many VerificationChecks
     * const verificationCheck = await prisma.verificationCheck.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VerificationChecks and only return the `id`
     * const verificationCheckWithIdOnly = await prisma.verificationCheck.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationCheckCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationCheckCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VerificationCheck.
     * @param {VerificationCheckDeleteArgs} args - Arguments to delete one VerificationCheck.
     * @example
     * // Delete one VerificationCheck
     * const VerificationCheck = await prisma.verificationCheck.delete({
     *   where: {
     *     // ... filter to delete one VerificationCheck
     *   }
     * })
     * 
     */
    delete<T extends VerificationCheckDeleteArgs>(args: SelectSubset<T, VerificationCheckDeleteArgs<ExtArgs>>): Prisma__VerificationCheckClient<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VerificationCheck.
     * @param {VerificationCheckUpdateArgs} args - Arguments to update one VerificationCheck.
     * @example
     * // Update one VerificationCheck
     * const verificationCheck = await prisma.verificationCheck.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationCheckUpdateArgs>(args: SelectSubset<T, VerificationCheckUpdateArgs<ExtArgs>>): Prisma__VerificationCheckClient<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VerificationChecks.
     * @param {VerificationCheckDeleteManyArgs} args - Arguments to filter VerificationChecks to delete.
     * @example
     * // Delete a few VerificationChecks
     * const { count } = await prisma.verificationCheck.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationCheckDeleteManyArgs>(args?: SelectSubset<T, VerificationCheckDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationChecks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCheckUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VerificationChecks
     * const verificationCheck = await prisma.verificationCheck.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationCheckUpdateManyArgs>(args: SelectSubset<T, VerificationCheckUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationChecks and returns the data updated in the database.
     * @param {VerificationCheckUpdateManyAndReturnArgs} args - Arguments to update many VerificationChecks.
     * @example
     * // Update many VerificationChecks
     * const verificationCheck = await prisma.verificationCheck.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VerificationChecks and only return the `id`
     * const verificationCheckWithIdOnly = await prisma.verificationCheck.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VerificationCheckUpdateManyAndReturnArgs>(args: SelectSubset<T, VerificationCheckUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VerificationCheck.
     * @param {VerificationCheckUpsertArgs} args - Arguments to update or create a VerificationCheck.
     * @example
     * // Update or create a VerificationCheck
     * const verificationCheck = await prisma.verificationCheck.upsert({
     *   create: {
     *     // ... data to create a VerificationCheck
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VerificationCheck we want to update
     *   }
     * })
     */
    upsert<T extends VerificationCheckUpsertArgs>(args: SelectSubset<T, VerificationCheckUpsertArgs<ExtArgs>>): Prisma__VerificationCheckClient<$Result.GetResult<Prisma.$VerificationCheckPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VerificationChecks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCheckCountArgs} args - Arguments to filter VerificationChecks to count.
     * @example
     * // Count the number of VerificationChecks
     * const count = await prisma.verificationCheck.count({
     *   where: {
     *     // ... the filter for the VerificationChecks we want to count
     *   }
     * })
    **/
    count<T extends VerificationCheckCountArgs>(
      args?: Subset<T, VerificationCheckCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationCheckCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VerificationCheck.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCheckAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationCheckAggregateArgs>(args: Subset<T, VerificationCheckAggregateArgs>): Prisma.PrismaPromise<GetVerificationCheckAggregateType<T>>

    /**
     * Group by VerificationCheck.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCheckGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VerificationCheckGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationCheckGroupByArgs['orderBy'] }
        : { orderBy?: VerificationCheckGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationCheckGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationCheckGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VerificationCheck model
   */
  readonly fields: VerificationCheckFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VerificationCheck.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationCheckClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    verification<T extends VerificationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, VerificationDefaultArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VerificationCheck model
   */
  interface VerificationCheckFieldRefs {
    readonly id: FieldRef<"VerificationCheck", 'String'>
    readonly verificationId: FieldRef<"VerificationCheck", 'String'>
    readonly checkName: FieldRef<"VerificationCheck", 'String'>
    readonly result: FieldRef<"VerificationCheck", 'CheckResult'>
    readonly detail: FieldRef<"VerificationCheck", 'String'>
  }
    

  // Custom InputTypes
  /**
   * VerificationCheck findUnique
   */
  export type VerificationCheckFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    /**
     * Filter, which VerificationCheck to fetch.
     */
    where: VerificationCheckWhereUniqueInput
  }

  /**
   * VerificationCheck findUniqueOrThrow
   */
  export type VerificationCheckFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    /**
     * Filter, which VerificationCheck to fetch.
     */
    where: VerificationCheckWhereUniqueInput
  }

  /**
   * VerificationCheck findFirst
   */
  export type VerificationCheckFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    /**
     * Filter, which VerificationCheck to fetch.
     */
    where?: VerificationCheckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationChecks to fetch.
     */
    orderBy?: VerificationCheckOrderByWithRelationInput | VerificationCheckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationChecks.
     */
    cursor?: VerificationCheckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationChecks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationChecks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationChecks.
     */
    distinct?: VerificationCheckScalarFieldEnum | VerificationCheckScalarFieldEnum[]
  }

  /**
   * VerificationCheck findFirstOrThrow
   */
  export type VerificationCheckFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    /**
     * Filter, which VerificationCheck to fetch.
     */
    where?: VerificationCheckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationChecks to fetch.
     */
    orderBy?: VerificationCheckOrderByWithRelationInput | VerificationCheckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationChecks.
     */
    cursor?: VerificationCheckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationChecks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationChecks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationChecks.
     */
    distinct?: VerificationCheckScalarFieldEnum | VerificationCheckScalarFieldEnum[]
  }

  /**
   * VerificationCheck findMany
   */
  export type VerificationCheckFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    /**
     * Filter, which VerificationChecks to fetch.
     */
    where?: VerificationCheckWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationChecks to fetch.
     */
    orderBy?: VerificationCheckOrderByWithRelationInput | VerificationCheckOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VerificationChecks.
     */
    cursor?: VerificationCheckWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationChecks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationChecks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationChecks.
     */
    distinct?: VerificationCheckScalarFieldEnum | VerificationCheckScalarFieldEnum[]
  }

  /**
   * VerificationCheck create
   */
  export type VerificationCheckCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    /**
     * The data needed to create a VerificationCheck.
     */
    data: XOR<VerificationCheckCreateInput, VerificationCheckUncheckedCreateInput>
  }

  /**
   * VerificationCheck createMany
   */
  export type VerificationCheckCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VerificationChecks.
     */
    data: VerificationCheckCreateManyInput | VerificationCheckCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationCheck createManyAndReturn
   */
  export type VerificationCheckCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * The data used to create many VerificationChecks.
     */
    data: VerificationCheckCreateManyInput | VerificationCheckCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationCheck update
   */
  export type VerificationCheckUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    /**
     * The data needed to update a VerificationCheck.
     */
    data: XOR<VerificationCheckUpdateInput, VerificationCheckUncheckedUpdateInput>
    /**
     * Choose, which VerificationCheck to update.
     */
    where: VerificationCheckWhereUniqueInput
  }

  /**
   * VerificationCheck updateMany
   */
  export type VerificationCheckUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VerificationChecks.
     */
    data: XOR<VerificationCheckUpdateManyMutationInput, VerificationCheckUncheckedUpdateManyInput>
    /**
     * Filter which VerificationChecks to update
     */
    where?: VerificationCheckWhereInput
    /**
     * Limit how many VerificationChecks to update.
     */
    limit?: number
  }

  /**
   * VerificationCheck updateManyAndReturn
   */
  export type VerificationCheckUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * The data used to update VerificationChecks.
     */
    data: XOR<VerificationCheckUpdateManyMutationInput, VerificationCheckUncheckedUpdateManyInput>
    /**
     * Filter which VerificationChecks to update
     */
    where?: VerificationCheckWhereInput
    /**
     * Limit how many VerificationChecks to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationCheck upsert
   */
  export type VerificationCheckUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    /**
     * The filter to search for the VerificationCheck to update in case it exists.
     */
    where: VerificationCheckWhereUniqueInput
    /**
     * In case the VerificationCheck found by the `where` argument doesn't exist, create a new VerificationCheck with this data.
     */
    create: XOR<VerificationCheckCreateInput, VerificationCheckUncheckedCreateInput>
    /**
     * In case the VerificationCheck was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationCheckUpdateInput, VerificationCheckUncheckedUpdateInput>
  }

  /**
   * VerificationCheck delete
   */
  export type VerificationCheckDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
    /**
     * Filter which VerificationCheck to delete.
     */
    where: VerificationCheckWhereUniqueInput
  }

  /**
   * VerificationCheck deleteMany
   */
  export type VerificationCheckDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationChecks to delete
     */
    where?: VerificationCheckWhereInput
    /**
     * Limit how many VerificationChecks to delete.
     */
    limit?: number
  }

  /**
   * VerificationCheck without action
   */
  export type VerificationCheckDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationCheck
     */
    select?: VerificationCheckSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationCheck
     */
    omit?: VerificationCheckOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationCheckInclude<ExtArgs> | null
  }


  /**
   * Model VerificationEvidence
   */

  export type AggregateVerificationEvidence = {
    _count: VerificationEvidenceCountAggregateOutputType | null
    _min: VerificationEvidenceMinAggregateOutputType | null
    _max: VerificationEvidenceMaxAggregateOutputType | null
  }

  export type VerificationEvidenceMinAggregateOutputType = {
    id: string | null
    verificationId: string | null
    evidenceType: string | null
    url: string | null
    fileRef: string | null
  }

  export type VerificationEvidenceMaxAggregateOutputType = {
    id: string | null
    verificationId: string | null
    evidenceType: string | null
    url: string | null
    fileRef: string | null
  }

  export type VerificationEvidenceCountAggregateOutputType = {
    id: number
    verificationId: number
    evidenceType: number
    url: number
    fileRef: number
    metadata: number
    _all: number
  }


  export type VerificationEvidenceMinAggregateInputType = {
    id?: true
    verificationId?: true
    evidenceType?: true
    url?: true
    fileRef?: true
  }

  export type VerificationEvidenceMaxAggregateInputType = {
    id?: true
    verificationId?: true
    evidenceType?: true
    url?: true
    fileRef?: true
  }

  export type VerificationEvidenceCountAggregateInputType = {
    id?: true
    verificationId?: true
    evidenceType?: true
    url?: true
    fileRef?: true
    metadata?: true
    _all?: true
  }

  export type VerificationEvidenceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationEvidence to aggregate.
     */
    where?: VerificationEvidenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationEvidences to fetch.
     */
    orderBy?: VerificationEvidenceOrderByWithRelationInput | VerificationEvidenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationEvidenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationEvidences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationEvidences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VerificationEvidences
    **/
    _count?: true | VerificationEvidenceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationEvidenceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationEvidenceMaxAggregateInputType
  }

  export type GetVerificationEvidenceAggregateType<T extends VerificationEvidenceAggregateArgs> = {
        [P in keyof T & keyof AggregateVerificationEvidence]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerificationEvidence[P]>
      : GetScalarType<T[P], AggregateVerificationEvidence[P]>
  }




  export type VerificationEvidenceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationEvidenceWhereInput
    orderBy?: VerificationEvidenceOrderByWithAggregationInput | VerificationEvidenceOrderByWithAggregationInput[]
    by: VerificationEvidenceScalarFieldEnum[] | VerificationEvidenceScalarFieldEnum
    having?: VerificationEvidenceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationEvidenceCountAggregateInputType | true
    _min?: VerificationEvidenceMinAggregateInputType
    _max?: VerificationEvidenceMaxAggregateInputType
  }

  export type VerificationEvidenceGroupByOutputType = {
    id: string
    verificationId: string
    evidenceType: string
    url: string | null
    fileRef: string | null
    metadata: JsonValue | null
    _count: VerificationEvidenceCountAggregateOutputType | null
    _min: VerificationEvidenceMinAggregateOutputType | null
    _max: VerificationEvidenceMaxAggregateOutputType | null
  }

  type GetVerificationEvidenceGroupByPayload<T extends VerificationEvidenceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationEvidenceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationEvidenceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationEvidenceGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationEvidenceGroupByOutputType[P]>
        }
      >
    >


  export type VerificationEvidenceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    verificationId?: boolean
    evidenceType?: boolean
    url?: boolean
    fileRef?: boolean
    metadata?: boolean
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationEvidence"]>

  export type VerificationEvidenceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    verificationId?: boolean
    evidenceType?: boolean
    url?: boolean
    fileRef?: boolean
    metadata?: boolean
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationEvidence"]>

  export type VerificationEvidenceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    verificationId?: boolean
    evidenceType?: boolean
    url?: boolean
    fileRef?: boolean
    metadata?: boolean
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationEvidence"]>

  export type VerificationEvidenceSelectScalar = {
    id?: boolean
    verificationId?: boolean
    evidenceType?: boolean
    url?: boolean
    fileRef?: boolean
    metadata?: boolean
  }

  export type VerificationEvidenceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "verificationId" | "evidenceType" | "url" | "fileRef" | "metadata", ExtArgs["result"]["verificationEvidence"]>
  export type VerificationEvidenceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }
  export type VerificationEvidenceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }
  export type VerificationEvidenceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }

  export type $VerificationEvidencePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VerificationEvidence"
    objects: {
      verification: Prisma.$VerificationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      verificationId: string
      evidenceType: string
      url: string | null
      fileRef: string | null
      metadata: Prisma.JsonValue | null
    }, ExtArgs["result"]["verificationEvidence"]>
    composites: {}
  }

  type VerificationEvidenceGetPayload<S extends boolean | null | undefined | VerificationEvidenceDefaultArgs> = $Result.GetResult<Prisma.$VerificationEvidencePayload, S>

  type VerificationEvidenceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationEvidenceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationEvidenceCountAggregateInputType | true
    }

  export interface VerificationEvidenceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VerificationEvidence'], meta: { name: 'VerificationEvidence' } }
    /**
     * Find zero or one VerificationEvidence that matches the filter.
     * @param {VerificationEvidenceFindUniqueArgs} args - Arguments to find a VerificationEvidence
     * @example
     * // Get one VerificationEvidence
     * const verificationEvidence = await prisma.verificationEvidence.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationEvidenceFindUniqueArgs>(args: SelectSubset<T, VerificationEvidenceFindUniqueArgs<ExtArgs>>): Prisma__VerificationEvidenceClient<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VerificationEvidence that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationEvidenceFindUniqueOrThrowArgs} args - Arguments to find a VerificationEvidence
     * @example
     * // Get one VerificationEvidence
     * const verificationEvidence = await prisma.verificationEvidence.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationEvidenceFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationEvidenceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationEvidenceClient<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationEvidence that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationEvidenceFindFirstArgs} args - Arguments to find a VerificationEvidence
     * @example
     * // Get one VerificationEvidence
     * const verificationEvidence = await prisma.verificationEvidence.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationEvidenceFindFirstArgs>(args?: SelectSubset<T, VerificationEvidenceFindFirstArgs<ExtArgs>>): Prisma__VerificationEvidenceClient<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationEvidence that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationEvidenceFindFirstOrThrowArgs} args - Arguments to find a VerificationEvidence
     * @example
     * // Get one VerificationEvidence
     * const verificationEvidence = await prisma.verificationEvidence.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationEvidenceFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationEvidenceFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationEvidenceClient<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VerificationEvidences that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationEvidenceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VerificationEvidences
     * const verificationEvidences = await prisma.verificationEvidence.findMany()
     * 
     * // Get first 10 VerificationEvidences
     * const verificationEvidences = await prisma.verificationEvidence.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const verificationEvidenceWithIdOnly = await prisma.verificationEvidence.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VerificationEvidenceFindManyArgs>(args?: SelectSubset<T, VerificationEvidenceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VerificationEvidence.
     * @param {VerificationEvidenceCreateArgs} args - Arguments to create a VerificationEvidence.
     * @example
     * // Create one VerificationEvidence
     * const VerificationEvidence = await prisma.verificationEvidence.create({
     *   data: {
     *     // ... data to create a VerificationEvidence
     *   }
     * })
     * 
     */
    create<T extends VerificationEvidenceCreateArgs>(args: SelectSubset<T, VerificationEvidenceCreateArgs<ExtArgs>>): Prisma__VerificationEvidenceClient<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VerificationEvidences.
     * @param {VerificationEvidenceCreateManyArgs} args - Arguments to create many VerificationEvidences.
     * @example
     * // Create many VerificationEvidences
     * const verificationEvidence = await prisma.verificationEvidence.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationEvidenceCreateManyArgs>(args?: SelectSubset<T, VerificationEvidenceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VerificationEvidences and returns the data saved in the database.
     * @param {VerificationEvidenceCreateManyAndReturnArgs} args - Arguments to create many VerificationEvidences.
     * @example
     * // Create many VerificationEvidences
     * const verificationEvidence = await prisma.verificationEvidence.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VerificationEvidences and only return the `id`
     * const verificationEvidenceWithIdOnly = await prisma.verificationEvidence.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationEvidenceCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationEvidenceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VerificationEvidence.
     * @param {VerificationEvidenceDeleteArgs} args - Arguments to delete one VerificationEvidence.
     * @example
     * // Delete one VerificationEvidence
     * const VerificationEvidence = await prisma.verificationEvidence.delete({
     *   where: {
     *     // ... filter to delete one VerificationEvidence
     *   }
     * })
     * 
     */
    delete<T extends VerificationEvidenceDeleteArgs>(args: SelectSubset<T, VerificationEvidenceDeleteArgs<ExtArgs>>): Prisma__VerificationEvidenceClient<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VerificationEvidence.
     * @param {VerificationEvidenceUpdateArgs} args - Arguments to update one VerificationEvidence.
     * @example
     * // Update one VerificationEvidence
     * const verificationEvidence = await prisma.verificationEvidence.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationEvidenceUpdateArgs>(args: SelectSubset<T, VerificationEvidenceUpdateArgs<ExtArgs>>): Prisma__VerificationEvidenceClient<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VerificationEvidences.
     * @param {VerificationEvidenceDeleteManyArgs} args - Arguments to filter VerificationEvidences to delete.
     * @example
     * // Delete a few VerificationEvidences
     * const { count } = await prisma.verificationEvidence.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationEvidenceDeleteManyArgs>(args?: SelectSubset<T, VerificationEvidenceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationEvidences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationEvidenceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VerificationEvidences
     * const verificationEvidence = await prisma.verificationEvidence.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationEvidenceUpdateManyArgs>(args: SelectSubset<T, VerificationEvidenceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationEvidences and returns the data updated in the database.
     * @param {VerificationEvidenceUpdateManyAndReturnArgs} args - Arguments to update many VerificationEvidences.
     * @example
     * // Update many VerificationEvidences
     * const verificationEvidence = await prisma.verificationEvidence.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VerificationEvidences and only return the `id`
     * const verificationEvidenceWithIdOnly = await prisma.verificationEvidence.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VerificationEvidenceUpdateManyAndReturnArgs>(args: SelectSubset<T, VerificationEvidenceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VerificationEvidence.
     * @param {VerificationEvidenceUpsertArgs} args - Arguments to update or create a VerificationEvidence.
     * @example
     * // Update or create a VerificationEvidence
     * const verificationEvidence = await prisma.verificationEvidence.upsert({
     *   create: {
     *     // ... data to create a VerificationEvidence
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VerificationEvidence we want to update
     *   }
     * })
     */
    upsert<T extends VerificationEvidenceUpsertArgs>(args: SelectSubset<T, VerificationEvidenceUpsertArgs<ExtArgs>>): Prisma__VerificationEvidenceClient<$Result.GetResult<Prisma.$VerificationEvidencePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VerificationEvidences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationEvidenceCountArgs} args - Arguments to filter VerificationEvidences to count.
     * @example
     * // Count the number of VerificationEvidences
     * const count = await prisma.verificationEvidence.count({
     *   where: {
     *     // ... the filter for the VerificationEvidences we want to count
     *   }
     * })
    **/
    count<T extends VerificationEvidenceCountArgs>(
      args?: Subset<T, VerificationEvidenceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationEvidenceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VerificationEvidence.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationEvidenceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationEvidenceAggregateArgs>(args: Subset<T, VerificationEvidenceAggregateArgs>): Prisma.PrismaPromise<GetVerificationEvidenceAggregateType<T>>

    /**
     * Group by VerificationEvidence.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationEvidenceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VerificationEvidenceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationEvidenceGroupByArgs['orderBy'] }
        : { orderBy?: VerificationEvidenceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationEvidenceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationEvidenceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VerificationEvidence model
   */
  readonly fields: VerificationEvidenceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VerificationEvidence.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationEvidenceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    verification<T extends VerificationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, VerificationDefaultArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VerificationEvidence model
   */
  interface VerificationEvidenceFieldRefs {
    readonly id: FieldRef<"VerificationEvidence", 'String'>
    readonly verificationId: FieldRef<"VerificationEvidence", 'String'>
    readonly evidenceType: FieldRef<"VerificationEvidence", 'String'>
    readonly url: FieldRef<"VerificationEvidence", 'String'>
    readonly fileRef: FieldRef<"VerificationEvidence", 'String'>
    readonly metadata: FieldRef<"VerificationEvidence", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * VerificationEvidence findUnique
   */
  export type VerificationEvidenceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    /**
     * Filter, which VerificationEvidence to fetch.
     */
    where: VerificationEvidenceWhereUniqueInput
  }

  /**
   * VerificationEvidence findUniqueOrThrow
   */
  export type VerificationEvidenceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    /**
     * Filter, which VerificationEvidence to fetch.
     */
    where: VerificationEvidenceWhereUniqueInput
  }

  /**
   * VerificationEvidence findFirst
   */
  export type VerificationEvidenceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    /**
     * Filter, which VerificationEvidence to fetch.
     */
    where?: VerificationEvidenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationEvidences to fetch.
     */
    orderBy?: VerificationEvidenceOrderByWithRelationInput | VerificationEvidenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationEvidences.
     */
    cursor?: VerificationEvidenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationEvidences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationEvidences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationEvidences.
     */
    distinct?: VerificationEvidenceScalarFieldEnum | VerificationEvidenceScalarFieldEnum[]
  }

  /**
   * VerificationEvidence findFirstOrThrow
   */
  export type VerificationEvidenceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    /**
     * Filter, which VerificationEvidence to fetch.
     */
    where?: VerificationEvidenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationEvidences to fetch.
     */
    orderBy?: VerificationEvidenceOrderByWithRelationInput | VerificationEvidenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationEvidences.
     */
    cursor?: VerificationEvidenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationEvidences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationEvidences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationEvidences.
     */
    distinct?: VerificationEvidenceScalarFieldEnum | VerificationEvidenceScalarFieldEnum[]
  }

  /**
   * VerificationEvidence findMany
   */
  export type VerificationEvidenceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    /**
     * Filter, which VerificationEvidences to fetch.
     */
    where?: VerificationEvidenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationEvidences to fetch.
     */
    orderBy?: VerificationEvidenceOrderByWithRelationInput | VerificationEvidenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VerificationEvidences.
     */
    cursor?: VerificationEvidenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationEvidences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationEvidences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationEvidences.
     */
    distinct?: VerificationEvidenceScalarFieldEnum | VerificationEvidenceScalarFieldEnum[]
  }

  /**
   * VerificationEvidence create
   */
  export type VerificationEvidenceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    /**
     * The data needed to create a VerificationEvidence.
     */
    data: XOR<VerificationEvidenceCreateInput, VerificationEvidenceUncheckedCreateInput>
  }

  /**
   * VerificationEvidence createMany
   */
  export type VerificationEvidenceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VerificationEvidences.
     */
    data: VerificationEvidenceCreateManyInput | VerificationEvidenceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationEvidence createManyAndReturn
   */
  export type VerificationEvidenceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * The data used to create many VerificationEvidences.
     */
    data: VerificationEvidenceCreateManyInput | VerificationEvidenceCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationEvidence update
   */
  export type VerificationEvidenceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    /**
     * The data needed to update a VerificationEvidence.
     */
    data: XOR<VerificationEvidenceUpdateInput, VerificationEvidenceUncheckedUpdateInput>
    /**
     * Choose, which VerificationEvidence to update.
     */
    where: VerificationEvidenceWhereUniqueInput
  }

  /**
   * VerificationEvidence updateMany
   */
  export type VerificationEvidenceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VerificationEvidences.
     */
    data: XOR<VerificationEvidenceUpdateManyMutationInput, VerificationEvidenceUncheckedUpdateManyInput>
    /**
     * Filter which VerificationEvidences to update
     */
    where?: VerificationEvidenceWhereInput
    /**
     * Limit how many VerificationEvidences to update.
     */
    limit?: number
  }

  /**
   * VerificationEvidence updateManyAndReturn
   */
  export type VerificationEvidenceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * The data used to update VerificationEvidences.
     */
    data: XOR<VerificationEvidenceUpdateManyMutationInput, VerificationEvidenceUncheckedUpdateManyInput>
    /**
     * Filter which VerificationEvidences to update
     */
    where?: VerificationEvidenceWhereInput
    /**
     * Limit how many VerificationEvidences to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationEvidence upsert
   */
  export type VerificationEvidenceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    /**
     * The filter to search for the VerificationEvidence to update in case it exists.
     */
    where: VerificationEvidenceWhereUniqueInput
    /**
     * In case the VerificationEvidence found by the `where` argument doesn't exist, create a new VerificationEvidence with this data.
     */
    create: XOR<VerificationEvidenceCreateInput, VerificationEvidenceUncheckedCreateInput>
    /**
     * In case the VerificationEvidence was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationEvidenceUpdateInput, VerificationEvidenceUncheckedUpdateInput>
  }

  /**
   * VerificationEvidence delete
   */
  export type VerificationEvidenceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
    /**
     * Filter which VerificationEvidence to delete.
     */
    where: VerificationEvidenceWhereUniqueInput
  }

  /**
   * VerificationEvidence deleteMany
   */
  export type VerificationEvidenceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationEvidences to delete
     */
    where?: VerificationEvidenceWhereInput
    /**
     * Limit how many VerificationEvidences to delete.
     */
    limit?: number
  }

  /**
   * VerificationEvidence without action
   */
  export type VerificationEvidenceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationEvidence
     */
    select?: VerificationEvidenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationEvidence
     */
    omit?: VerificationEvidenceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationEvidenceInclude<ExtArgs> | null
  }


  /**
   * Model VerificationAttempt
   */

  export type AggregateVerificationAttempt = {
    _count: VerificationAttemptCountAggregateOutputType | null
    _avg: VerificationAttemptAvgAggregateOutputType | null
    _sum: VerificationAttemptSumAggregateOutputType | null
    _min: VerificationAttemptMinAggregateOutputType | null
    _max: VerificationAttemptMaxAggregateOutputType | null
  }

  export type VerificationAttemptAvgAggregateOutputType = {
    durationMs: number | null
  }

  export type VerificationAttemptSumAggregateOutputType = {
    durationMs: number | null
  }

  export type VerificationAttemptMinAggregateOutputType = {
    id: string | null
    verificationId: string | null
    attemptedAt: Date | null
    outcome: string | null
    error: string | null
    durationMs: number | null
  }

  export type VerificationAttemptMaxAggregateOutputType = {
    id: string | null
    verificationId: string | null
    attemptedAt: Date | null
    outcome: string | null
    error: string | null
    durationMs: number | null
  }

  export type VerificationAttemptCountAggregateOutputType = {
    id: number
    verificationId: number
    attemptedAt: number
    outcome: number
    error: number
    durationMs: number
    _all: number
  }


  export type VerificationAttemptAvgAggregateInputType = {
    durationMs?: true
  }

  export type VerificationAttemptSumAggregateInputType = {
    durationMs?: true
  }

  export type VerificationAttemptMinAggregateInputType = {
    id?: true
    verificationId?: true
    attemptedAt?: true
    outcome?: true
    error?: true
    durationMs?: true
  }

  export type VerificationAttemptMaxAggregateInputType = {
    id?: true
    verificationId?: true
    attemptedAt?: true
    outcome?: true
    error?: true
    durationMs?: true
  }

  export type VerificationAttemptCountAggregateInputType = {
    id?: true
    verificationId?: true
    attemptedAt?: true
    outcome?: true
    error?: true
    durationMs?: true
    _all?: true
  }

  export type VerificationAttemptAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationAttempt to aggregate.
     */
    where?: VerificationAttemptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationAttempts to fetch.
     */
    orderBy?: VerificationAttemptOrderByWithRelationInput | VerificationAttemptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationAttemptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationAttempts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationAttempts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VerificationAttempts
    **/
    _count?: true | VerificationAttemptCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: VerificationAttemptAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: VerificationAttemptSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationAttemptMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationAttemptMaxAggregateInputType
  }

  export type GetVerificationAttemptAggregateType<T extends VerificationAttemptAggregateArgs> = {
        [P in keyof T & keyof AggregateVerificationAttempt]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerificationAttempt[P]>
      : GetScalarType<T[P], AggregateVerificationAttempt[P]>
  }




  export type VerificationAttemptGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationAttemptWhereInput
    orderBy?: VerificationAttemptOrderByWithAggregationInput | VerificationAttemptOrderByWithAggregationInput[]
    by: VerificationAttemptScalarFieldEnum[] | VerificationAttemptScalarFieldEnum
    having?: VerificationAttemptScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationAttemptCountAggregateInputType | true
    _avg?: VerificationAttemptAvgAggregateInputType
    _sum?: VerificationAttemptSumAggregateInputType
    _min?: VerificationAttemptMinAggregateInputType
    _max?: VerificationAttemptMaxAggregateInputType
  }

  export type VerificationAttemptGroupByOutputType = {
    id: string
    verificationId: string
    attemptedAt: Date
    outcome: string
    error: string | null
    durationMs: number | null
    _count: VerificationAttemptCountAggregateOutputType | null
    _avg: VerificationAttemptAvgAggregateOutputType | null
    _sum: VerificationAttemptSumAggregateOutputType | null
    _min: VerificationAttemptMinAggregateOutputType | null
    _max: VerificationAttemptMaxAggregateOutputType | null
  }

  type GetVerificationAttemptGroupByPayload<T extends VerificationAttemptGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationAttemptGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationAttemptGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationAttemptGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationAttemptGroupByOutputType[P]>
        }
      >
    >


  export type VerificationAttemptSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    verificationId?: boolean
    attemptedAt?: boolean
    outcome?: boolean
    error?: boolean
    durationMs?: boolean
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationAttempt"]>

  export type VerificationAttemptSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    verificationId?: boolean
    attemptedAt?: boolean
    outcome?: boolean
    error?: boolean
    durationMs?: boolean
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationAttempt"]>

  export type VerificationAttemptSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    verificationId?: boolean
    attemptedAt?: boolean
    outcome?: boolean
    error?: boolean
    durationMs?: boolean
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationAttempt"]>

  export type VerificationAttemptSelectScalar = {
    id?: boolean
    verificationId?: boolean
    attemptedAt?: boolean
    outcome?: boolean
    error?: boolean
    durationMs?: boolean
  }

  export type VerificationAttemptOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "verificationId" | "attemptedAt" | "outcome" | "error" | "durationMs", ExtArgs["result"]["verificationAttempt"]>
  export type VerificationAttemptInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }
  export type VerificationAttemptIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }
  export type VerificationAttemptIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verification?: boolean | VerificationDefaultArgs<ExtArgs>
  }

  export type $VerificationAttemptPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VerificationAttempt"
    objects: {
      verification: Prisma.$VerificationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      verificationId: string
      attemptedAt: Date
      outcome: string
      error: string | null
      durationMs: number | null
    }, ExtArgs["result"]["verificationAttempt"]>
    composites: {}
  }

  type VerificationAttemptGetPayload<S extends boolean | null | undefined | VerificationAttemptDefaultArgs> = $Result.GetResult<Prisma.$VerificationAttemptPayload, S>

  type VerificationAttemptCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationAttemptFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationAttemptCountAggregateInputType | true
    }

  export interface VerificationAttemptDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VerificationAttempt'], meta: { name: 'VerificationAttempt' } }
    /**
     * Find zero or one VerificationAttempt that matches the filter.
     * @param {VerificationAttemptFindUniqueArgs} args - Arguments to find a VerificationAttempt
     * @example
     * // Get one VerificationAttempt
     * const verificationAttempt = await prisma.verificationAttempt.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationAttemptFindUniqueArgs>(args: SelectSubset<T, VerificationAttemptFindUniqueArgs<ExtArgs>>): Prisma__VerificationAttemptClient<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VerificationAttempt that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationAttemptFindUniqueOrThrowArgs} args - Arguments to find a VerificationAttempt
     * @example
     * // Get one VerificationAttempt
     * const verificationAttempt = await prisma.verificationAttempt.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationAttemptFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationAttemptFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationAttemptClient<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationAttempt that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationAttemptFindFirstArgs} args - Arguments to find a VerificationAttempt
     * @example
     * // Get one VerificationAttempt
     * const verificationAttempt = await prisma.verificationAttempt.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationAttemptFindFirstArgs>(args?: SelectSubset<T, VerificationAttemptFindFirstArgs<ExtArgs>>): Prisma__VerificationAttemptClient<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationAttempt that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationAttemptFindFirstOrThrowArgs} args - Arguments to find a VerificationAttempt
     * @example
     * // Get one VerificationAttempt
     * const verificationAttempt = await prisma.verificationAttempt.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationAttemptFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationAttemptFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationAttemptClient<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VerificationAttempts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationAttemptFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VerificationAttempts
     * const verificationAttempts = await prisma.verificationAttempt.findMany()
     * 
     * // Get first 10 VerificationAttempts
     * const verificationAttempts = await prisma.verificationAttempt.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const verificationAttemptWithIdOnly = await prisma.verificationAttempt.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VerificationAttemptFindManyArgs>(args?: SelectSubset<T, VerificationAttemptFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VerificationAttempt.
     * @param {VerificationAttemptCreateArgs} args - Arguments to create a VerificationAttempt.
     * @example
     * // Create one VerificationAttempt
     * const VerificationAttempt = await prisma.verificationAttempt.create({
     *   data: {
     *     // ... data to create a VerificationAttempt
     *   }
     * })
     * 
     */
    create<T extends VerificationAttemptCreateArgs>(args: SelectSubset<T, VerificationAttemptCreateArgs<ExtArgs>>): Prisma__VerificationAttemptClient<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VerificationAttempts.
     * @param {VerificationAttemptCreateManyArgs} args - Arguments to create many VerificationAttempts.
     * @example
     * // Create many VerificationAttempts
     * const verificationAttempt = await prisma.verificationAttempt.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationAttemptCreateManyArgs>(args?: SelectSubset<T, VerificationAttemptCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VerificationAttempts and returns the data saved in the database.
     * @param {VerificationAttemptCreateManyAndReturnArgs} args - Arguments to create many VerificationAttempts.
     * @example
     * // Create many VerificationAttempts
     * const verificationAttempt = await prisma.verificationAttempt.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VerificationAttempts and only return the `id`
     * const verificationAttemptWithIdOnly = await prisma.verificationAttempt.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationAttemptCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationAttemptCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VerificationAttempt.
     * @param {VerificationAttemptDeleteArgs} args - Arguments to delete one VerificationAttempt.
     * @example
     * // Delete one VerificationAttempt
     * const VerificationAttempt = await prisma.verificationAttempt.delete({
     *   where: {
     *     // ... filter to delete one VerificationAttempt
     *   }
     * })
     * 
     */
    delete<T extends VerificationAttemptDeleteArgs>(args: SelectSubset<T, VerificationAttemptDeleteArgs<ExtArgs>>): Prisma__VerificationAttemptClient<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VerificationAttempt.
     * @param {VerificationAttemptUpdateArgs} args - Arguments to update one VerificationAttempt.
     * @example
     * // Update one VerificationAttempt
     * const verificationAttempt = await prisma.verificationAttempt.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationAttemptUpdateArgs>(args: SelectSubset<T, VerificationAttemptUpdateArgs<ExtArgs>>): Prisma__VerificationAttemptClient<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VerificationAttempts.
     * @param {VerificationAttemptDeleteManyArgs} args - Arguments to filter VerificationAttempts to delete.
     * @example
     * // Delete a few VerificationAttempts
     * const { count } = await prisma.verificationAttempt.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationAttemptDeleteManyArgs>(args?: SelectSubset<T, VerificationAttemptDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationAttempts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationAttemptUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VerificationAttempts
     * const verificationAttempt = await prisma.verificationAttempt.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationAttemptUpdateManyArgs>(args: SelectSubset<T, VerificationAttemptUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationAttempts and returns the data updated in the database.
     * @param {VerificationAttemptUpdateManyAndReturnArgs} args - Arguments to update many VerificationAttempts.
     * @example
     * // Update many VerificationAttempts
     * const verificationAttempt = await prisma.verificationAttempt.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VerificationAttempts and only return the `id`
     * const verificationAttemptWithIdOnly = await prisma.verificationAttempt.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VerificationAttemptUpdateManyAndReturnArgs>(args: SelectSubset<T, VerificationAttemptUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VerificationAttempt.
     * @param {VerificationAttemptUpsertArgs} args - Arguments to update or create a VerificationAttempt.
     * @example
     * // Update or create a VerificationAttempt
     * const verificationAttempt = await prisma.verificationAttempt.upsert({
     *   create: {
     *     // ... data to create a VerificationAttempt
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VerificationAttempt we want to update
     *   }
     * })
     */
    upsert<T extends VerificationAttemptUpsertArgs>(args: SelectSubset<T, VerificationAttemptUpsertArgs<ExtArgs>>): Prisma__VerificationAttemptClient<$Result.GetResult<Prisma.$VerificationAttemptPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VerificationAttempts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationAttemptCountArgs} args - Arguments to filter VerificationAttempts to count.
     * @example
     * // Count the number of VerificationAttempts
     * const count = await prisma.verificationAttempt.count({
     *   where: {
     *     // ... the filter for the VerificationAttempts we want to count
     *   }
     * })
    **/
    count<T extends VerificationAttemptCountArgs>(
      args?: Subset<T, VerificationAttemptCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationAttemptCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VerificationAttempt.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationAttemptAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationAttemptAggregateArgs>(args: Subset<T, VerificationAttemptAggregateArgs>): Prisma.PrismaPromise<GetVerificationAttemptAggregateType<T>>

    /**
     * Group by VerificationAttempt.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationAttemptGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VerificationAttemptGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationAttemptGroupByArgs['orderBy'] }
        : { orderBy?: VerificationAttemptGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationAttemptGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationAttemptGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VerificationAttempt model
   */
  readonly fields: VerificationAttemptFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VerificationAttempt.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationAttemptClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    verification<T extends VerificationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, VerificationDefaultArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VerificationAttempt model
   */
  interface VerificationAttemptFieldRefs {
    readonly id: FieldRef<"VerificationAttempt", 'String'>
    readonly verificationId: FieldRef<"VerificationAttempt", 'String'>
    readonly attemptedAt: FieldRef<"VerificationAttempt", 'DateTime'>
    readonly outcome: FieldRef<"VerificationAttempt", 'String'>
    readonly error: FieldRef<"VerificationAttempt", 'String'>
    readonly durationMs: FieldRef<"VerificationAttempt", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * VerificationAttempt findUnique
   */
  export type VerificationAttemptFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    /**
     * Filter, which VerificationAttempt to fetch.
     */
    where: VerificationAttemptWhereUniqueInput
  }

  /**
   * VerificationAttempt findUniqueOrThrow
   */
  export type VerificationAttemptFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    /**
     * Filter, which VerificationAttempt to fetch.
     */
    where: VerificationAttemptWhereUniqueInput
  }

  /**
   * VerificationAttempt findFirst
   */
  export type VerificationAttemptFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    /**
     * Filter, which VerificationAttempt to fetch.
     */
    where?: VerificationAttemptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationAttempts to fetch.
     */
    orderBy?: VerificationAttemptOrderByWithRelationInput | VerificationAttemptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationAttempts.
     */
    cursor?: VerificationAttemptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationAttempts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationAttempts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationAttempts.
     */
    distinct?: VerificationAttemptScalarFieldEnum | VerificationAttemptScalarFieldEnum[]
  }

  /**
   * VerificationAttempt findFirstOrThrow
   */
  export type VerificationAttemptFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    /**
     * Filter, which VerificationAttempt to fetch.
     */
    where?: VerificationAttemptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationAttempts to fetch.
     */
    orderBy?: VerificationAttemptOrderByWithRelationInput | VerificationAttemptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationAttempts.
     */
    cursor?: VerificationAttemptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationAttempts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationAttempts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationAttempts.
     */
    distinct?: VerificationAttemptScalarFieldEnum | VerificationAttemptScalarFieldEnum[]
  }

  /**
   * VerificationAttempt findMany
   */
  export type VerificationAttemptFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    /**
     * Filter, which VerificationAttempts to fetch.
     */
    where?: VerificationAttemptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationAttempts to fetch.
     */
    orderBy?: VerificationAttemptOrderByWithRelationInput | VerificationAttemptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VerificationAttempts.
     */
    cursor?: VerificationAttemptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationAttempts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationAttempts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationAttempts.
     */
    distinct?: VerificationAttemptScalarFieldEnum | VerificationAttemptScalarFieldEnum[]
  }

  /**
   * VerificationAttempt create
   */
  export type VerificationAttemptCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    /**
     * The data needed to create a VerificationAttempt.
     */
    data: XOR<VerificationAttemptCreateInput, VerificationAttemptUncheckedCreateInput>
  }

  /**
   * VerificationAttempt createMany
   */
  export type VerificationAttemptCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VerificationAttempts.
     */
    data: VerificationAttemptCreateManyInput | VerificationAttemptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationAttempt createManyAndReturn
   */
  export type VerificationAttemptCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * The data used to create many VerificationAttempts.
     */
    data: VerificationAttemptCreateManyInput | VerificationAttemptCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationAttempt update
   */
  export type VerificationAttemptUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    /**
     * The data needed to update a VerificationAttempt.
     */
    data: XOR<VerificationAttemptUpdateInput, VerificationAttemptUncheckedUpdateInput>
    /**
     * Choose, which VerificationAttempt to update.
     */
    where: VerificationAttemptWhereUniqueInput
  }

  /**
   * VerificationAttempt updateMany
   */
  export type VerificationAttemptUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VerificationAttempts.
     */
    data: XOR<VerificationAttemptUpdateManyMutationInput, VerificationAttemptUncheckedUpdateManyInput>
    /**
     * Filter which VerificationAttempts to update
     */
    where?: VerificationAttemptWhereInput
    /**
     * Limit how many VerificationAttempts to update.
     */
    limit?: number
  }

  /**
   * VerificationAttempt updateManyAndReturn
   */
  export type VerificationAttemptUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * The data used to update VerificationAttempts.
     */
    data: XOR<VerificationAttemptUpdateManyMutationInput, VerificationAttemptUncheckedUpdateManyInput>
    /**
     * Filter which VerificationAttempts to update
     */
    where?: VerificationAttemptWhereInput
    /**
     * Limit how many VerificationAttempts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationAttempt upsert
   */
  export type VerificationAttemptUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    /**
     * The filter to search for the VerificationAttempt to update in case it exists.
     */
    where: VerificationAttemptWhereUniqueInput
    /**
     * In case the VerificationAttempt found by the `where` argument doesn't exist, create a new VerificationAttempt with this data.
     */
    create: XOR<VerificationAttemptCreateInput, VerificationAttemptUncheckedCreateInput>
    /**
     * In case the VerificationAttempt was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationAttemptUpdateInput, VerificationAttemptUncheckedUpdateInput>
  }

  /**
   * VerificationAttempt delete
   */
  export type VerificationAttemptDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
    /**
     * Filter which VerificationAttempt to delete.
     */
    where: VerificationAttemptWhereUniqueInput
  }

  /**
   * VerificationAttempt deleteMany
   */
  export type VerificationAttemptDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationAttempts to delete
     */
    where?: VerificationAttemptWhereInput
    /**
     * Limit how many VerificationAttempts to delete.
     */
    limit?: number
  }

  /**
   * VerificationAttempt without action
   */
  export type VerificationAttemptDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationAttempt
     */
    select?: VerificationAttemptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationAttempt
     */
    omit?: VerificationAttemptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationAttemptInclude<ExtArgs> | null
  }


  /**
   * Model IssuerAdapter
   */

  export type AggregateIssuerAdapter = {
    _count: IssuerAdapterCountAggregateOutputType | null
    _min: IssuerAdapterMinAggregateOutputType | null
    _max: IssuerAdapterMaxAggregateOutputType | null
  }

  export type IssuerAdapterMinAggregateOutputType = {
    id: string | null
    issuerId: string | null
    adapterName: string | null
    integrationType: $Enums.IntegrationType | null
    confidence: $Enums.ConfidenceLevel | null
    notes: string | null
    updatedAt: Date | null
  }

  export type IssuerAdapterMaxAggregateOutputType = {
    id: string | null
    issuerId: string | null
    adapterName: string | null
    integrationType: $Enums.IntegrationType | null
    confidence: $Enums.ConfidenceLevel | null
    notes: string | null
    updatedAt: Date | null
  }

  export type IssuerAdapterCountAggregateOutputType = {
    id: number
    issuerId: number
    adapterName: number
    integrationType: number
    capabilities: number
    confidence: number
    notes: number
    updatedAt: number
    _all: number
  }


  export type IssuerAdapterMinAggregateInputType = {
    id?: true
    issuerId?: true
    adapterName?: true
    integrationType?: true
    confidence?: true
    notes?: true
    updatedAt?: true
  }

  export type IssuerAdapterMaxAggregateInputType = {
    id?: true
    issuerId?: true
    adapterName?: true
    integrationType?: true
    confidence?: true
    notes?: true
    updatedAt?: true
  }

  export type IssuerAdapterCountAggregateInputType = {
    id?: true
    issuerId?: true
    adapterName?: true
    integrationType?: true
    capabilities?: true
    confidence?: true
    notes?: true
    updatedAt?: true
    _all?: true
  }

  export type IssuerAdapterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IssuerAdapter to aggregate.
     */
    where?: IssuerAdapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IssuerAdapters to fetch.
     */
    orderBy?: IssuerAdapterOrderByWithRelationInput | IssuerAdapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IssuerAdapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IssuerAdapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IssuerAdapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned IssuerAdapters
    **/
    _count?: true | IssuerAdapterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IssuerAdapterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IssuerAdapterMaxAggregateInputType
  }

  export type GetIssuerAdapterAggregateType<T extends IssuerAdapterAggregateArgs> = {
        [P in keyof T & keyof AggregateIssuerAdapter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIssuerAdapter[P]>
      : GetScalarType<T[P], AggregateIssuerAdapter[P]>
  }




  export type IssuerAdapterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IssuerAdapterWhereInput
    orderBy?: IssuerAdapterOrderByWithAggregationInput | IssuerAdapterOrderByWithAggregationInput[]
    by: IssuerAdapterScalarFieldEnum[] | IssuerAdapterScalarFieldEnum
    having?: IssuerAdapterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IssuerAdapterCountAggregateInputType | true
    _min?: IssuerAdapterMinAggregateInputType
    _max?: IssuerAdapterMaxAggregateInputType
  }

  export type IssuerAdapterGroupByOutputType = {
    id: string
    issuerId: string | null
    adapterName: string
    integrationType: $Enums.IntegrationType
    capabilities: JsonValue
    confidence: $Enums.ConfidenceLevel | null
    notes: string | null
    updatedAt: Date
    _count: IssuerAdapterCountAggregateOutputType | null
    _min: IssuerAdapterMinAggregateOutputType | null
    _max: IssuerAdapterMaxAggregateOutputType | null
  }

  type GetIssuerAdapterGroupByPayload<T extends IssuerAdapterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IssuerAdapterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IssuerAdapterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IssuerAdapterGroupByOutputType[P]>
            : GetScalarType<T[P], IssuerAdapterGroupByOutputType[P]>
        }
      >
    >


  export type IssuerAdapterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    issuerId?: boolean
    adapterName?: boolean
    integrationType?: boolean
    capabilities?: boolean
    confidence?: boolean
    notes?: boolean
    updatedAt?: boolean
    issuer?: boolean | IssuerAdapter$issuerArgs<ExtArgs>
  }, ExtArgs["result"]["issuerAdapter"]>

  export type IssuerAdapterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    issuerId?: boolean
    adapterName?: boolean
    integrationType?: boolean
    capabilities?: boolean
    confidence?: boolean
    notes?: boolean
    updatedAt?: boolean
    issuer?: boolean | IssuerAdapter$issuerArgs<ExtArgs>
  }, ExtArgs["result"]["issuerAdapter"]>

  export type IssuerAdapterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    issuerId?: boolean
    adapterName?: boolean
    integrationType?: boolean
    capabilities?: boolean
    confidence?: boolean
    notes?: boolean
    updatedAt?: boolean
    issuer?: boolean | IssuerAdapter$issuerArgs<ExtArgs>
  }, ExtArgs["result"]["issuerAdapter"]>

  export type IssuerAdapterSelectScalar = {
    id?: boolean
    issuerId?: boolean
    adapterName?: boolean
    integrationType?: boolean
    capabilities?: boolean
    confidence?: boolean
    notes?: boolean
    updatedAt?: boolean
  }

  export type IssuerAdapterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "issuerId" | "adapterName" | "integrationType" | "capabilities" | "confidence" | "notes" | "updatedAt", ExtArgs["result"]["issuerAdapter"]>
  export type IssuerAdapterInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    issuer?: boolean | IssuerAdapter$issuerArgs<ExtArgs>
  }
  export type IssuerAdapterIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    issuer?: boolean | IssuerAdapter$issuerArgs<ExtArgs>
  }
  export type IssuerAdapterIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    issuer?: boolean | IssuerAdapter$issuerArgs<ExtArgs>
  }

  export type $IssuerAdapterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "IssuerAdapter"
    objects: {
      issuer: Prisma.$IssuerPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      issuerId: string | null
      adapterName: string
      integrationType: $Enums.IntegrationType
      capabilities: Prisma.JsonValue
      confidence: $Enums.ConfidenceLevel | null
      notes: string | null
      updatedAt: Date
    }, ExtArgs["result"]["issuerAdapter"]>
    composites: {}
  }

  type IssuerAdapterGetPayload<S extends boolean | null | undefined | IssuerAdapterDefaultArgs> = $Result.GetResult<Prisma.$IssuerAdapterPayload, S>

  type IssuerAdapterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IssuerAdapterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IssuerAdapterCountAggregateInputType | true
    }

  export interface IssuerAdapterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['IssuerAdapter'], meta: { name: 'IssuerAdapter' } }
    /**
     * Find zero or one IssuerAdapter that matches the filter.
     * @param {IssuerAdapterFindUniqueArgs} args - Arguments to find a IssuerAdapter
     * @example
     * // Get one IssuerAdapter
     * const issuerAdapter = await prisma.issuerAdapter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IssuerAdapterFindUniqueArgs>(args: SelectSubset<T, IssuerAdapterFindUniqueArgs<ExtArgs>>): Prisma__IssuerAdapterClient<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one IssuerAdapter that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IssuerAdapterFindUniqueOrThrowArgs} args - Arguments to find a IssuerAdapter
     * @example
     * // Get one IssuerAdapter
     * const issuerAdapter = await prisma.issuerAdapter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IssuerAdapterFindUniqueOrThrowArgs>(args: SelectSubset<T, IssuerAdapterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IssuerAdapterClient<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IssuerAdapter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerAdapterFindFirstArgs} args - Arguments to find a IssuerAdapter
     * @example
     * // Get one IssuerAdapter
     * const issuerAdapter = await prisma.issuerAdapter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IssuerAdapterFindFirstArgs>(args?: SelectSubset<T, IssuerAdapterFindFirstArgs<ExtArgs>>): Prisma__IssuerAdapterClient<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IssuerAdapter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerAdapterFindFirstOrThrowArgs} args - Arguments to find a IssuerAdapter
     * @example
     * // Get one IssuerAdapter
     * const issuerAdapter = await prisma.issuerAdapter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IssuerAdapterFindFirstOrThrowArgs>(args?: SelectSubset<T, IssuerAdapterFindFirstOrThrowArgs<ExtArgs>>): Prisma__IssuerAdapterClient<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more IssuerAdapters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerAdapterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all IssuerAdapters
     * const issuerAdapters = await prisma.issuerAdapter.findMany()
     * 
     * // Get first 10 IssuerAdapters
     * const issuerAdapters = await prisma.issuerAdapter.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const issuerAdapterWithIdOnly = await prisma.issuerAdapter.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IssuerAdapterFindManyArgs>(args?: SelectSubset<T, IssuerAdapterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a IssuerAdapter.
     * @param {IssuerAdapterCreateArgs} args - Arguments to create a IssuerAdapter.
     * @example
     * // Create one IssuerAdapter
     * const IssuerAdapter = await prisma.issuerAdapter.create({
     *   data: {
     *     // ... data to create a IssuerAdapter
     *   }
     * })
     * 
     */
    create<T extends IssuerAdapterCreateArgs>(args: SelectSubset<T, IssuerAdapterCreateArgs<ExtArgs>>): Prisma__IssuerAdapterClient<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many IssuerAdapters.
     * @param {IssuerAdapterCreateManyArgs} args - Arguments to create many IssuerAdapters.
     * @example
     * // Create many IssuerAdapters
     * const issuerAdapter = await prisma.issuerAdapter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IssuerAdapterCreateManyArgs>(args?: SelectSubset<T, IssuerAdapterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many IssuerAdapters and returns the data saved in the database.
     * @param {IssuerAdapterCreateManyAndReturnArgs} args - Arguments to create many IssuerAdapters.
     * @example
     * // Create many IssuerAdapters
     * const issuerAdapter = await prisma.issuerAdapter.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many IssuerAdapters and only return the `id`
     * const issuerAdapterWithIdOnly = await prisma.issuerAdapter.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IssuerAdapterCreateManyAndReturnArgs>(args?: SelectSubset<T, IssuerAdapterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a IssuerAdapter.
     * @param {IssuerAdapterDeleteArgs} args - Arguments to delete one IssuerAdapter.
     * @example
     * // Delete one IssuerAdapter
     * const IssuerAdapter = await prisma.issuerAdapter.delete({
     *   where: {
     *     // ... filter to delete one IssuerAdapter
     *   }
     * })
     * 
     */
    delete<T extends IssuerAdapterDeleteArgs>(args: SelectSubset<T, IssuerAdapterDeleteArgs<ExtArgs>>): Prisma__IssuerAdapterClient<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one IssuerAdapter.
     * @param {IssuerAdapterUpdateArgs} args - Arguments to update one IssuerAdapter.
     * @example
     * // Update one IssuerAdapter
     * const issuerAdapter = await prisma.issuerAdapter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IssuerAdapterUpdateArgs>(args: SelectSubset<T, IssuerAdapterUpdateArgs<ExtArgs>>): Prisma__IssuerAdapterClient<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more IssuerAdapters.
     * @param {IssuerAdapterDeleteManyArgs} args - Arguments to filter IssuerAdapters to delete.
     * @example
     * // Delete a few IssuerAdapters
     * const { count } = await prisma.issuerAdapter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IssuerAdapterDeleteManyArgs>(args?: SelectSubset<T, IssuerAdapterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IssuerAdapters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerAdapterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many IssuerAdapters
     * const issuerAdapter = await prisma.issuerAdapter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IssuerAdapterUpdateManyArgs>(args: SelectSubset<T, IssuerAdapterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IssuerAdapters and returns the data updated in the database.
     * @param {IssuerAdapterUpdateManyAndReturnArgs} args - Arguments to update many IssuerAdapters.
     * @example
     * // Update many IssuerAdapters
     * const issuerAdapter = await prisma.issuerAdapter.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more IssuerAdapters and only return the `id`
     * const issuerAdapterWithIdOnly = await prisma.issuerAdapter.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IssuerAdapterUpdateManyAndReturnArgs>(args: SelectSubset<T, IssuerAdapterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one IssuerAdapter.
     * @param {IssuerAdapterUpsertArgs} args - Arguments to update or create a IssuerAdapter.
     * @example
     * // Update or create a IssuerAdapter
     * const issuerAdapter = await prisma.issuerAdapter.upsert({
     *   create: {
     *     // ... data to create a IssuerAdapter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the IssuerAdapter we want to update
     *   }
     * })
     */
    upsert<T extends IssuerAdapterUpsertArgs>(args: SelectSubset<T, IssuerAdapterUpsertArgs<ExtArgs>>): Prisma__IssuerAdapterClient<$Result.GetResult<Prisma.$IssuerAdapterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of IssuerAdapters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerAdapterCountArgs} args - Arguments to filter IssuerAdapters to count.
     * @example
     * // Count the number of IssuerAdapters
     * const count = await prisma.issuerAdapter.count({
     *   where: {
     *     // ... the filter for the IssuerAdapters we want to count
     *   }
     * })
    **/
    count<T extends IssuerAdapterCountArgs>(
      args?: Subset<T, IssuerAdapterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IssuerAdapterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a IssuerAdapter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerAdapterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IssuerAdapterAggregateArgs>(args: Subset<T, IssuerAdapterAggregateArgs>): Prisma.PrismaPromise<GetIssuerAdapterAggregateType<T>>

    /**
     * Group by IssuerAdapter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IssuerAdapterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IssuerAdapterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IssuerAdapterGroupByArgs['orderBy'] }
        : { orderBy?: IssuerAdapterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IssuerAdapterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIssuerAdapterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the IssuerAdapter model
   */
  readonly fields: IssuerAdapterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for IssuerAdapter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IssuerAdapterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    issuer<T extends IssuerAdapter$issuerArgs<ExtArgs> = {}>(args?: Subset<T, IssuerAdapter$issuerArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the IssuerAdapter model
   */
  interface IssuerAdapterFieldRefs {
    readonly id: FieldRef<"IssuerAdapter", 'String'>
    readonly issuerId: FieldRef<"IssuerAdapter", 'String'>
    readonly adapterName: FieldRef<"IssuerAdapter", 'String'>
    readonly integrationType: FieldRef<"IssuerAdapter", 'IntegrationType'>
    readonly capabilities: FieldRef<"IssuerAdapter", 'Json'>
    readonly confidence: FieldRef<"IssuerAdapter", 'ConfidenceLevel'>
    readonly notes: FieldRef<"IssuerAdapter", 'String'>
    readonly updatedAt: FieldRef<"IssuerAdapter", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * IssuerAdapter findUnique
   */
  export type IssuerAdapterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    /**
     * Filter, which IssuerAdapter to fetch.
     */
    where: IssuerAdapterWhereUniqueInput
  }

  /**
   * IssuerAdapter findUniqueOrThrow
   */
  export type IssuerAdapterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    /**
     * Filter, which IssuerAdapter to fetch.
     */
    where: IssuerAdapterWhereUniqueInput
  }

  /**
   * IssuerAdapter findFirst
   */
  export type IssuerAdapterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    /**
     * Filter, which IssuerAdapter to fetch.
     */
    where?: IssuerAdapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IssuerAdapters to fetch.
     */
    orderBy?: IssuerAdapterOrderByWithRelationInput | IssuerAdapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IssuerAdapters.
     */
    cursor?: IssuerAdapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IssuerAdapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IssuerAdapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IssuerAdapters.
     */
    distinct?: IssuerAdapterScalarFieldEnum | IssuerAdapterScalarFieldEnum[]
  }

  /**
   * IssuerAdapter findFirstOrThrow
   */
  export type IssuerAdapterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    /**
     * Filter, which IssuerAdapter to fetch.
     */
    where?: IssuerAdapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IssuerAdapters to fetch.
     */
    orderBy?: IssuerAdapterOrderByWithRelationInput | IssuerAdapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IssuerAdapters.
     */
    cursor?: IssuerAdapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IssuerAdapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IssuerAdapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IssuerAdapters.
     */
    distinct?: IssuerAdapterScalarFieldEnum | IssuerAdapterScalarFieldEnum[]
  }

  /**
   * IssuerAdapter findMany
   */
  export type IssuerAdapterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    /**
     * Filter, which IssuerAdapters to fetch.
     */
    where?: IssuerAdapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IssuerAdapters to fetch.
     */
    orderBy?: IssuerAdapterOrderByWithRelationInput | IssuerAdapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing IssuerAdapters.
     */
    cursor?: IssuerAdapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IssuerAdapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IssuerAdapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IssuerAdapters.
     */
    distinct?: IssuerAdapterScalarFieldEnum | IssuerAdapterScalarFieldEnum[]
  }

  /**
   * IssuerAdapter create
   */
  export type IssuerAdapterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    /**
     * The data needed to create a IssuerAdapter.
     */
    data: XOR<IssuerAdapterCreateInput, IssuerAdapterUncheckedCreateInput>
  }

  /**
   * IssuerAdapter createMany
   */
  export type IssuerAdapterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many IssuerAdapters.
     */
    data: IssuerAdapterCreateManyInput | IssuerAdapterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * IssuerAdapter createManyAndReturn
   */
  export type IssuerAdapterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * The data used to create many IssuerAdapters.
     */
    data: IssuerAdapterCreateManyInput | IssuerAdapterCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * IssuerAdapter update
   */
  export type IssuerAdapterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    /**
     * The data needed to update a IssuerAdapter.
     */
    data: XOR<IssuerAdapterUpdateInput, IssuerAdapterUncheckedUpdateInput>
    /**
     * Choose, which IssuerAdapter to update.
     */
    where: IssuerAdapterWhereUniqueInput
  }

  /**
   * IssuerAdapter updateMany
   */
  export type IssuerAdapterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update IssuerAdapters.
     */
    data: XOR<IssuerAdapterUpdateManyMutationInput, IssuerAdapterUncheckedUpdateManyInput>
    /**
     * Filter which IssuerAdapters to update
     */
    where?: IssuerAdapterWhereInput
    /**
     * Limit how many IssuerAdapters to update.
     */
    limit?: number
  }

  /**
   * IssuerAdapter updateManyAndReturn
   */
  export type IssuerAdapterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * The data used to update IssuerAdapters.
     */
    data: XOR<IssuerAdapterUpdateManyMutationInput, IssuerAdapterUncheckedUpdateManyInput>
    /**
     * Filter which IssuerAdapters to update
     */
    where?: IssuerAdapterWhereInput
    /**
     * Limit how many IssuerAdapters to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * IssuerAdapter upsert
   */
  export type IssuerAdapterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    /**
     * The filter to search for the IssuerAdapter to update in case it exists.
     */
    where: IssuerAdapterWhereUniqueInput
    /**
     * In case the IssuerAdapter found by the `where` argument doesn't exist, create a new IssuerAdapter with this data.
     */
    create: XOR<IssuerAdapterCreateInput, IssuerAdapterUncheckedCreateInput>
    /**
     * In case the IssuerAdapter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IssuerAdapterUpdateInput, IssuerAdapterUncheckedUpdateInput>
  }

  /**
   * IssuerAdapter delete
   */
  export type IssuerAdapterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
    /**
     * Filter which IssuerAdapter to delete.
     */
    where: IssuerAdapterWhereUniqueInput
  }

  /**
   * IssuerAdapter deleteMany
   */
  export type IssuerAdapterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IssuerAdapters to delete
     */
    where?: IssuerAdapterWhereInput
    /**
     * Limit how many IssuerAdapters to delete.
     */
    limit?: number
  }

  /**
   * IssuerAdapter.issuer
   */
  export type IssuerAdapter$issuerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    where?: IssuerWhereInput
  }

  /**
   * IssuerAdapter without action
   */
  export type IssuerAdapterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IssuerAdapter
     */
    select?: IssuerAdapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IssuerAdapter
     */
    omit?: IssuerAdapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerAdapterInclude<ExtArgs> | null
  }


  /**
   * Model TrustRegistryEntry
   */

  export type AggregateTrustRegistryEntry = {
    _count: TrustRegistryEntryCountAggregateOutputType | null
    _min: TrustRegistryEntryMinAggregateOutputType | null
    _max: TrustRegistryEntryMaxAggregateOutputType | null
  }

  export type TrustRegistryEntryMinAggregateOutputType = {
    id: string | null
    issuerId: string | null
    platformName: string | null
    trustLevel: string | null
    notes: string | null
    updatedAt: Date | null
  }

  export type TrustRegistryEntryMaxAggregateOutputType = {
    id: string | null
    issuerId: string | null
    platformName: string | null
    trustLevel: string | null
    notes: string | null
    updatedAt: Date | null
  }

  export type TrustRegistryEntryCountAggregateOutputType = {
    id: number
    issuerId: number
    platformName: number
    trustLevel: number
    notes: number
    updatedAt: number
    _all: number
  }


  export type TrustRegistryEntryMinAggregateInputType = {
    id?: true
    issuerId?: true
    platformName?: true
    trustLevel?: true
    notes?: true
    updatedAt?: true
  }

  export type TrustRegistryEntryMaxAggregateInputType = {
    id?: true
    issuerId?: true
    platformName?: true
    trustLevel?: true
    notes?: true
    updatedAt?: true
  }

  export type TrustRegistryEntryCountAggregateInputType = {
    id?: true
    issuerId?: true
    platformName?: true
    trustLevel?: true
    notes?: true
    updatedAt?: true
    _all?: true
  }

  export type TrustRegistryEntryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrustRegistryEntry to aggregate.
     */
    where?: TrustRegistryEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrustRegistryEntries to fetch.
     */
    orderBy?: TrustRegistryEntryOrderByWithRelationInput | TrustRegistryEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TrustRegistryEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrustRegistryEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrustRegistryEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TrustRegistryEntries
    **/
    _count?: true | TrustRegistryEntryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TrustRegistryEntryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TrustRegistryEntryMaxAggregateInputType
  }

  export type GetTrustRegistryEntryAggregateType<T extends TrustRegistryEntryAggregateArgs> = {
        [P in keyof T & keyof AggregateTrustRegistryEntry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrustRegistryEntry[P]>
      : GetScalarType<T[P], AggregateTrustRegistryEntry[P]>
  }




  export type TrustRegistryEntryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrustRegistryEntryWhereInput
    orderBy?: TrustRegistryEntryOrderByWithAggregationInput | TrustRegistryEntryOrderByWithAggregationInput[]
    by: TrustRegistryEntryScalarFieldEnum[] | TrustRegistryEntryScalarFieldEnum
    having?: TrustRegistryEntryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TrustRegistryEntryCountAggregateInputType | true
    _min?: TrustRegistryEntryMinAggregateInputType
    _max?: TrustRegistryEntryMaxAggregateInputType
  }

  export type TrustRegistryEntryGroupByOutputType = {
    id: string
    issuerId: string | null
    platformName: string | null
    trustLevel: string
    notes: string | null
    updatedAt: Date
    _count: TrustRegistryEntryCountAggregateOutputType | null
    _min: TrustRegistryEntryMinAggregateOutputType | null
    _max: TrustRegistryEntryMaxAggregateOutputType | null
  }

  type GetTrustRegistryEntryGroupByPayload<T extends TrustRegistryEntryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TrustRegistryEntryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TrustRegistryEntryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TrustRegistryEntryGroupByOutputType[P]>
            : GetScalarType<T[P], TrustRegistryEntryGroupByOutputType[P]>
        }
      >
    >


  export type TrustRegistryEntrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    issuerId?: boolean
    platformName?: boolean
    trustLevel?: boolean
    notes?: boolean
    updatedAt?: boolean
    issuer?: boolean | TrustRegistryEntry$issuerArgs<ExtArgs>
  }, ExtArgs["result"]["trustRegistryEntry"]>

  export type TrustRegistryEntrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    issuerId?: boolean
    platformName?: boolean
    trustLevel?: boolean
    notes?: boolean
    updatedAt?: boolean
    issuer?: boolean | TrustRegistryEntry$issuerArgs<ExtArgs>
  }, ExtArgs["result"]["trustRegistryEntry"]>

  export type TrustRegistryEntrySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    issuerId?: boolean
    platformName?: boolean
    trustLevel?: boolean
    notes?: boolean
    updatedAt?: boolean
    issuer?: boolean | TrustRegistryEntry$issuerArgs<ExtArgs>
  }, ExtArgs["result"]["trustRegistryEntry"]>

  export type TrustRegistryEntrySelectScalar = {
    id?: boolean
    issuerId?: boolean
    platformName?: boolean
    trustLevel?: boolean
    notes?: boolean
    updatedAt?: boolean
  }

  export type TrustRegistryEntryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "issuerId" | "platformName" | "trustLevel" | "notes" | "updatedAt", ExtArgs["result"]["trustRegistryEntry"]>
  export type TrustRegistryEntryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    issuer?: boolean | TrustRegistryEntry$issuerArgs<ExtArgs>
  }
  export type TrustRegistryEntryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    issuer?: boolean | TrustRegistryEntry$issuerArgs<ExtArgs>
  }
  export type TrustRegistryEntryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    issuer?: boolean | TrustRegistryEntry$issuerArgs<ExtArgs>
  }

  export type $TrustRegistryEntryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TrustRegistryEntry"
    objects: {
      issuer: Prisma.$IssuerPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      issuerId: string | null
      platformName: string | null
      trustLevel: string
      notes: string | null
      updatedAt: Date
    }, ExtArgs["result"]["trustRegistryEntry"]>
    composites: {}
  }

  type TrustRegistryEntryGetPayload<S extends boolean | null | undefined | TrustRegistryEntryDefaultArgs> = $Result.GetResult<Prisma.$TrustRegistryEntryPayload, S>

  type TrustRegistryEntryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TrustRegistryEntryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TrustRegistryEntryCountAggregateInputType | true
    }

  export interface TrustRegistryEntryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TrustRegistryEntry'], meta: { name: 'TrustRegistryEntry' } }
    /**
     * Find zero or one TrustRegistryEntry that matches the filter.
     * @param {TrustRegistryEntryFindUniqueArgs} args - Arguments to find a TrustRegistryEntry
     * @example
     * // Get one TrustRegistryEntry
     * const trustRegistryEntry = await prisma.trustRegistryEntry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TrustRegistryEntryFindUniqueArgs>(args: SelectSubset<T, TrustRegistryEntryFindUniqueArgs<ExtArgs>>): Prisma__TrustRegistryEntryClient<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TrustRegistryEntry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TrustRegistryEntryFindUniqueOrThrowArgs} args - Arguments to find a TrustRegistryEntry
     * @example
     * // Get one TrustRegistryEntry
     * const trustRegistryEntry = await prisma.trustRegistryEntry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TrustRegistryEntryFindUniqueOrThrowArgs>(args: SelectSubset<T, TrustRegistryEntryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TrustRegistryEntryClient<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TrustRegistryEntry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrustRegistryEntryFindFirstArgs} args - Arguments to find a TrustRegistryEntry
     * @example
     * // Get one TrustRegistryEntry
     * const trustRegistryEntry = await prisma.trustRegistryEntry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TrustRegistryEntryFindFirstArgs>(args?: SelectSubset<T, TrustRegistryEntryFindFirstArgs<ExtArgs>>): Prisma__TrustRegistryEntryClient<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TrustRegistryEntry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrustRegistryEntryFindFirstOrThrowArgs} args - Arguments to find a TrustRegistryEntry
     * @example
     * // Get one TrustRegistryEntry
     * const trustRegistryEntry = await prisma.trustRegistryEntry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TrustRegistryEntryFindFirstOrThrowArgs>(args?: SelectSubset<T, TrustRegistryEntryFindFirstOrThrowArgs<ExtArgs>>): Prisma__TrustRegistryEntryClient<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TrustRegistryEntries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrustRegistryEntryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TrustRegistryEntries
     * const trustRegistryEntries = await prisma.trustRegistryEntry.findMany()
     * 
     * // Get first 10 TrustRegistryEntries
     * const trustRegistryEntries = await prisma.trustRegistryEntry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const trustRegistryEntryWithIdOnly = await prisma.trustRegistryEntry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TrustRegistryEntryFindManyArgs>(args?: SelectSubset<T, TrustRegistryEntryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TrustRegistryEntry.
     * @param {TrustRegistryEntryCreateArgs} args - Arguments to create a TrustRegistryEntry.
     * @example
     * // Create one TrustRegistryEntry
     * const TrustRegistryEntry = await prisma.trustRegistryEntry.create({
     *   data: {
     *     // ... data to create a TrustRegistryEntry
     *   }
     * })
     * 
     */
    create<T extends TrustRegistryEntryCreateArgs>(args: SelectSubset<T, TrustRegistryEntryCreateArgs<ExtArgs>>): Prisma__TrustRegistryEntryClient<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TrustRegistryEntries.
     * @param {TrustRegistryEntryCreateManyArgs} args - Arguments to create many TrustRegistryEntries.
     * @example
     * // Create many TrustRegistryEntries
     * const trustRegistryEntry = await prisma.trustRegistryEntry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TrustRegistryEntryCreateManyArgs>(args?: SelectSubset<T, TrustRegistryEntryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TrustRegistryEntries and returns the data saved in the database.
     * @param {TrustRegistryEntryCreateManyAndReturnArgs} args - Arguments to create many TrustRegistryEntries.
     * @example
     * // Create many TrustRegistryEntries
     * const trustRegistryEntry = await prisma.trustRegistryEntry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TrustRegistryEntries and only return the `id`
     * const trustRegistryEntryWithIdOnly = await prisma.trustRegistryEntry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TrustRegistryEntryCreateManyAndReturnArgs>(args?: SelectSubset<T, TrustRegistryEntryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TrustRegistryEntry.
     * @param {TrustRegistryEntryDeleteArgs} args - Arguments to delete one TrustRegistryEntry.
     * @example
     * // Delete one TrustRegistryEntry
     * const TrustRegistryEntry = await prisma.trustRegistryEntry.delete({
     *   where: {
     *     // ... filter to delete one TrustRegistryEntry
     *   }
     * })
     * 
     */
    delete<T extends TrustRegistryEntryDeleteArgs>(args: SelectSubset<T, TrustRegistryEntryDeleteArgs<ExtArgs>>): Prisma__TrustRegistryEntryClient<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TrustRegistryEntry.
     * @param {TrustRegistryEntryUpdateArgs} args - Arguments to update one TrustRegistryEntry.
     * @example
     * // Update one TrustRegistryEntry
     * const trustRegistryEntry = await prisma.trustRegistryEntry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TrustRegistryEntryUpdateArgs>(args: SelectSubset<T, TrustRegistryEntryUpdateArgs<ExtArgs>>): Prisma__TrustRegistryEntryClient<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TrustRegistryEntries.
     * @param {TrustRegistryEntryDeleteManyArgs} args - Arguments to filter TrustRegistryEntries to delete.
     * @example
     * // Delete a few TrustRegistryEntries
     * const { count } = await prisma.trustRegistryEntry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TrustRegistryEntryDeleteManyArgs>(args?: SelectSubset<T, TrustRegistryEntryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TrustRegistryEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrustRegistryEntryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TrustRegistryEntries
     * const trustRegistryEntry = await prisma.trustRegistryEntry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TrustRegistryEntryUpdateManyArgs>(args: SelectSubset<T, TrustRegistryEntryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TrustRegistryEntries and returns the data updated in the database.
     * @param {TrustRegistryEntryUpdateManyAndReturnArgs} args - Arguments to update many TrustRegistryEntries.
     * @example
     * // Update many TrustRegistryEntries
     * const trustRegistryEntry = await prisma.trustRegistryEntry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TrustRegistryEntries and only return the `id`
     * const trustRegistryEntryWithIdOnly = await prisma.trustRegistryEntry.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TrustRegistryEntryUpdateManyAndReturnArgs>(args: SelectSubset<T, TrustRegistryEntryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TrustRegistryEntry.
     * @param {TrustRegistryEntryUpsertArgs} args - Arguments to update or create a TrustRegistryEntry.
     * @example
     * // Update or create a TrustRegistryEntry
     * const trustRegistryEntry = await prisma.trustRegistryEntry.upsert({
     *   create: {
     *     // ... data to create a TrustRegistryEntry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TrustRegistryEntry we want to update
     *   }
     * })
     */
    upsert<T extends TrustRegistryEntryUpsertArgs>(args: SelectSubset<T, TrustRegistryEntryUpsertArgs<ExtArgs>>): Prisma__TrustRegistryEntryClient<$Result.GetResult<Prisma.$TrustRegistryEntryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TrustRegistryEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrustRegistryEntryCountArgs} args - Arguments to filter TrustRegistryEntries to count.
     * @example
     * // Count the number of TrustRegistryEntries
     * const count = await prisma.trustRegistryEntry.count({
     *   where: {
     *     // ... the filter for the TrustRegistryEntries we want to count
     *   }
     * })
    **/
    count<T extends TrustRegistryEntryCountArgs>(
      args?: Subset<T, TrustRegistryEntryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TrustRegistryEntryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TrustRegistryEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrustRegistryEntryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TrustRegistryEntryAggregateArgs>(args: Subset<T, TrustRegistryEntryAggregateArgs>): Prisma.PrismaPromise<GetTrustRegistryEntryAggregateType<T>>

    /**
     * Group by TrustRegistryEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrustRegistryEntryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TrustRegistryEntryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TrustRegistryEntryGroupByArgs['orderBy'] }
        : { orderBy?: TrustRegistryEntryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TrustRegistryEntryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTrustRegistryEntryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TrustRegistryEntry model
   */
  readonly fields: TrustRegistryEntryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TrustRegistryEntry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TrustRegistryEntryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    issuer<T extends TrustRegistryEntry$issuerArgs<ExtArgs> = {}>(args?: Subset<T, TrustRegistryEntry$issuerArgs<ExtArgs>>): Prisma__IssuerClient<$Result.GetResult<Prisma.$IssuerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TrustRegistryEntry model
   */
  interface TrustRegistryEntryFieldRefs {
    readonly id: FieldRef<"TrustRegistryEntry", 'String'>
    readonly issuerId: FieldRef<"TrustRegistryEntry", 'String'>
    readonly platformName: FieldRef<"TrustRegistryEntry", 'String'>
    readonly trustLevel: FieldRef<"TrustRegistryEntry", 'String'>
    readonly notes: FieldRef<"TrustRegistryEntry", 'String'>
    readonly updatedAt: FieldRef<"TrustRegistryEntry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TrustRegistryEntry findUnique
   */
  export type TrustRegistryEntryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TrustRegistryEntry to fetch.
     */
    where: TrustRegistryEntryWhereUniqueInput
  }

  /**
   * TrustRegistryEntry findUniqueOrThrow
   */
  export type TrustRegistryEntryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TrustRegistryEntry to fetch.
     */
    where: TrustRegistryEntryWhereUniqueInput
  }

  /**
   * TrustRegistryEntry findFirst
   */
  export type TrustRegistryEntryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TrustRegistryEntry to fetch.
     */
    where?: TrustRegistryEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrustRegistryEntries to fetch.
     */
    orderBy?: TrustRegistryEntryOrderByWithRelationInput | TrustRegistryEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TrustRegistryEntries.
     */
    cursor?: TrustRegistryEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrustRegistryEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrustRegistryEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TrustRegistryEntries.
     */
    distinct?: TrustRegistryEntryScalarFieldEnum | TrustRegistryEntryScalarFieldEnum[]
  }

  /**
   * TrustRegistryEntry findFirstOrThrow
   */
  export type TrustRegistryEntryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TrustRegistryEntry to fetch.
     */
    where?: TrustRegistryEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrustRegistryEntries to fetch.
     */
    orderBy?: TrustRegistryEntryOrderByWithRelationInput | TrustRegistryEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TrustRegistryEntries.
     */
    cursor?: TrustRegistryEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrustRegistryEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrustRegistryEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TrustRegistryEntries.
     */
    distinct?: TrustRegistryEntryScalarFieldEnum | TrustRegistryEntryScalarFieldEnum[]
  }

  /**
   * TrustRegistryEntry findMany
   */
  export type TrustRegistryEntryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TrustRegistryEntries to fetch.
     */
    where?: TrustRegistryEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrustRegistryEntries to fetch.
     */
    orderBy?: TrustRegistryEntryOrderByWithRelationInput | TrustRegistryEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TrustRegistryEntries.
     */
    cursor?: TrustRegistryEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrustRegistryEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrustRegistryEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TrustRegistryEntries.
     */
    distinct?: TrustRegistryEntryScalarFieldEnum | TrustRegistryEntryScalarFieldEnum[]
  }

  /**
   * TrustRegistryEntry create
   */
  export type TrustRegistryEntryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    /**
     * The data needed to create a TrustRegistryEntry.
     */
    data: XOR<TrustRegistryEntryCreateInput, TrustRegistryEntryUncheckedCreateInput>
  }

  /**
   * TrustRegistryEntry createMany
   */
  export type TrustRegistryEntryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TrustRegistryEntries.
     */
    data: TrustRegistryEntryCreateManyInput | TrustRegistryEntryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TrustRegistryEntry createManyAndReturn
   */
  export type TrustRegistryEntryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * The data used to create many TrustRegistryEntries.
     */
    data: TrustRegistryEntryCreateManyInput | TrustRegistryEntryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TrustRegistryEntry update
   */
  export type TrustRegistryEntryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    /**
     * The data needed to update a TrustRegistryEntry.
     */
    data: XOR<TrustRegistryEntryUpdateInput, TrustRegistryEntryUncheckedUpdateInput>
    /**
     * Choose, which TrustRegistryEntry to update.
     */
    where: TrustRegistryEntryWhereUniqueInput
  }

  /**
   * TrustRegistryEntry updateMany
   */
  export type TrustRegistryEntryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TrustRegistryEntries.
     */
    data: XOR<TrustRegistryEntryUpdateManyMutationInput, TrustRegistryEntryUncheckedUpdateManyInput>
    /**
     * Filter which TrustRegistryEntries to update
     */
    where?: TrustRegistryEntryWhereInput
    /**
     * Limit how many TrustRegistryEntries to update.
     */
    limit?: number
  }

  /**
   * TrustRegistryEntry updateManyAndReturn
   */
  export type TrustRegistryEntryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * The data used to update TrustRegistryEntries.
     */
    data: XOR<TrustRegistryEntryUpdateManyMutationInput, TrustRegistryEntryUncheckedUpdateManyInput>
    /**
     * Filter which TrustRegistryEntries to update
     */
    where?: TrustRegistryEntryWhereInput
    /**
     * Limit how many TrustRegistryEntries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TrustRegistryEntry upsert
   */
  export type TrustRegistryEntryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    /**
     * The filter to search for the TrustRegistryEntry to update in case it exists.
     */
    where: TrustRegistryEntryWhereUniqueInput
    /**
     * In case the TrustRegistryEntry found by the `where` argument doesn't exist, create a new TrustRegistryEntry with this data.
     */
    create: XOR<TrustRegistryEntryCreateInput, TrustRegistryEntryUncheckedCreateInput>
    /**
     * In case the TrustRegistryEntry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TrustRegistryEntryUpdateInput, TrustRegistryEntryUncheckedUpdateInput>
  }

  /**
   * TrustRegistryEntry delete
   */
  export type TrustRegistryEntryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
    /**
     * Filter which TrustRegistryEntry to delete.
     */
    where: TrustRegistryEntryWhereUniqueInput
  }

  /**
   * TrustRegistryEntry deleteMany
   */
  export type TrustRegistryEntryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrustRegistryEntries to delete
     */
    where?: TrustRegistryEntryWhereInput
    /**
     * Limit how many TrustRegistryEntries to delete.
     */
    limit?: number
  }

  /**
   * TrustRegistryEntry.issuer
   */
  export type TrustRegistryEntry$issuerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Issuer
     */
    select?: IssuerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Issuer
     */
    omit?: IssuerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IssuerInclude<ExtArgs> | null
    where?: IssuerWhereInput
  }

  /**
   * TrustRegistryEntry without action
   */
  export type TrustRegistryEntryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrustRegistryEntry
     */
    select?: TrustRegistryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrustRegistryEntry
     */
    omit?: TrustRegistryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrustRegistryEntryInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const IssuerScalarFieldEnum: {
    id: 'id',
    name: 'name',
    domain: 'domain',
    issuerType: 'issuerType',
    trustStatus: 'trustStatus',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type IssuerScalarFieldEnum = (typeof IssuerScalarFieldEnum)[keyof typeof IssuerScalarFieldEnum]


  export const SubjectScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    externalIdentifier: 'externalIdentifier',
    createdAt: 'createdAt'
  };

  export type SubjectScalarFieldEnum = (typeof SubjectScalarFieldEnum)[keyof typeof SubjectScalarFieldEnum]


  export const AchievementScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    credentialType: 'credentialType',
    level: 'level',
    skills: 'skills',
    framework: 'framework'
  };

  export type AchievementScalarFieldEnum = (typeof AchievementScalarFieldEnum)[keyof typeof AchievementScalarFieldEnum]


  export const CredentialScalarFieldEnum: {
    id: 'id',
    issuerId: 'issuerId',
    subjectId: 'subjectId',
    achievementId: 'achievementId',
    credentialType: 'credentialType',
    issueDate: 'issueDate',
    expirationDate: 'expirationDate',
    status: 'status',
    source: 'source',
    sourceIdentifier: 'sourceIdentifier',
    rawMetadata: 'rawMetadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CredentialScalarFieldEnum = (typeof CredentialScalarFieldEnum)[keyof typeof CredentialScalarFieldEnum]


  export const VerificationScalarFieldEnum: {
    id: 'id',
    credentialId: 'credentialId',
    method: 'method',
    provider: 'provider',
    verificationLevel: 'verificationLevel',
    verifiedAt: 'verifiedAt',
    adapterVersion: 'adapterVersion',
    evidenceUrl: 'evidenceUrl',
    rawResponse: 'rawResponse',
    createdAt: 'createdAt'
  };

  export type VerificationScalarFieldEnum = (typeof VerificationScalarFieldEnum)[keyof typeof VerificationScalarFieldEnum]


  export const VerificationCheckScalarFieldEnum: {
    id: 'id',
    verificationId: 'verificationId',
    checkName: 'checkName',
    result: 'result',
    detail: 'detail'
  };

  export type VerificationCheckScalarFieldEnum = (typeof VerificationCheckScalarFieldEnum)[keyof typeof VerificationCheckScalarFieldEnum]


  export const VerificationEvidenceScalarFieldEnum: {
    id: 'id',
    verificationId: 'verificationId',
    evidenceType: 'evidenceType',
    url: 'url',
    fileRef: 'fileRef',
    metadata: 'metadata'
  };

  export type VerificationEvidenceScalarFieldEnum = (typeof VerificationEvidenceScalarFieldEnum)[keyof typeof VerificationEvidenceScalarFieldEnum]


  export const VerificationAttemptScalarFieldEnum: {
    id: 'id',
    verificationId: 'verificationId',
    attemptedAt: 'attemptedAt',
    outcome: 'outcome',
    error: 'error',
    durationMs: 'durationMs'
  };

  export type VerificationAttemptScalarFieldEnum = (typeof VerificationAttemptScalarFieldEnum)[keyof typeof VerificationAttemptScalarFieldEnum]


  export const IssuerAdapterScalarFieldEnum: {
    id: 'id',
    issuerId: 'issuerId',
    adapterName: 'adapterName',
    integrationType: 'integrationType',
    capabilities: 'capabilities',
    confidence: 'confidence',
    notes: 'notes',
    updatedAt: 'updatedAt'
  };

  export type IssuerAdapterScalarFieldEnum = (typeof IssuerAdapterScalarFieldEnum)[keyof typeof IssuerAdapterScalarFieldEnum]


  export const TrustRegistryEntryScalarFieldEnum: {
    id: 'id',
    issuerId: 'issuerId',
    platformName: 'platformName',
    trustLevel: 'trustLevel',
    notes: 'notes',
    updatedAt: 'updatedAt'
  };

  export type TrustRegistryEntryScalarFieldEnum = (typeof TrustRegistryEntryScalarFieldEnum)[keyof typeof TrustRegistryEntryScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'IssuerTrustStatus'
   */
  export type EnumIssuerTrustStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IssuerTrustStatus'>
    


  /**
   * Reference to a field of type 'IssuerTrustStatus[]'
   */
  export type ListEnumIssuerTrustStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IssuerTrustStatus[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'CredentialType'
   */
  export type EnumCredentialTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CredentialType'>
    


  /**
   * Reference to a field of type 'CredentialType[]'
   */
  export type ListEnumCredentialTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CredentialType[]'>
    


  /**
   * Reference to a field of type 'VerificationStatus'
   */
  export type EnumVerificationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationStatus'>
    


  /**
   * Reference to a field of type 'VerificationStatus[]'
   */
  export type ListEnumVerificationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationStatus[]'>
    


  /**
   * Reference to a field of type 'CredentialInputType'
   */
  export type EnumCredentialInputTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CredentialInputType'>
    


  /**
   * Reference to a field of type 'CredentialInputType[]'
   */
  export type ListEnumCredentialInputTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CredentialInputType[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'VerificationMethod'
   */
  export type EnumVerificationMethodFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationMethod'>
    


  /**
   * Reference to a field of type 'VerificationMethod[]'
   */
  export type ListEnumVerificationMethodFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationMethod[]'>
    


  /**
   * Reference to a field of type 'VerificationLevel'
   */
  export type EnumVerificationLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationLevel'>
    


  /**
   * Reference to a field of type 'VerificationLevel[]'
   */
  export type ListEnumVerificationLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationLevel[]'>
    


  /**
   * Reference to a field of type 'CheckResult'
   */
  export type EnumCheckResultFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CheckResult'>
    


  /**
   * Reference to a field of type 'CheckResult[]'
   */
  export type ListEnumCheckResultFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CheckResult[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'IntegrationType'
   */
  export type EnumIntegrationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationType'>
    


  /**
   * Reference to a field of type 'IntegrationType[]'
   */
  export type ListEnumIntegrationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationType[]'>
    


  /**
   * Reference to a field of type 'ConfidenceLevel'
   */
  export type EnumConfidenceLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ConfidenceLevel'>
    


  /**
   * Reference to a field of type 'ConfidenceLevel[]'
   */
  export type ListEnumConfidenceLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ConfidenceLevel[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type IssuerWhereInput = {
    AND?: IssuerWhereInput | IssuerWhereInput[]
    OR?: IssuerWhereInput[]
    NOT?: IssuerWhereInput | IssuerWhereInput[]
    id?: StringFilter<"Issuer"> | string
    name?: StringFilter<"Issuer"> | string
    domain?: StringNullableFilter<"Issuer"> | string | null
    issuerType?: StringFilter<"Issuer"> | string
    trustStatus?: EnumIssuerTrustStatusFilter<"Issuer"> | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFilter<"Issuer"> | Date | string
    updatedAt?: DateTimeFilter<"Issuer"> | Date | string
    credentials?: CredentialListRelationFilter
    adapters?: IssuerAdapterListRelationFilter
    trustRegistry?: TrustRegistryEntryListRelationFilter
  }

  export type IssuerOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    domain?: SortOrderInput | SortOrder
    issuerType?: SortOrder
    trustStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    credentials?: CredentialOrderByRelationAggregateInput
    adapters?: IssuerAdapterOrderByRelationAggregateInput
    trustRegistry?: TrustRegistryEntryOrderByRelationAggregateInput
  }

  export type IssuerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    domain?: string
    AND?: IssuerWhereInput | IssuerWhereInput[]
    OR?: IssuerWhereInput[]
    NOT?: IssuerWhereInput | IssuerWhereInput[]
    name?: StringFilter<"Issuer"> | string
    issuerType?: StringFilter<"Issuer"> | string
    trustStatus?: EnumIssuerTrustStatusFilter<"Issuer"> | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFilter<"Issuer"> | Date | string
    updatedAt?: DateTimeFilter<"Issuer"> | Date | string
    credentials?: CredentialListRelationFilter
    adapters?: IssuerAdapterListRelationFilter
    trustRegistry?: TrustRegistryEntryListRelationFilter
  }, "id" | "domain">

  export type IssuerOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    domain?: SortOrderInput | SortOrder
    issuerType?: SortOrder
    trustStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: IssuerCountOrderByAggregateInput
    _max?: IssuerMaxOrderByAggregateInput
    _min?: IssuerMinOrderByAggregateInput
  }

  export type IssuerScalarWhereWithAggregatesInput = {
    AND?: IssuerScalarWhereWithAggregatesInput | IssuerScalarWhereWithAggregatesInput[]
    OR?: IssuerScalarWhereWithAggregatesInput[]
    NOT?: IssuerScalarWhereWithAggregatesInput | IssuerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Issuer"> | string
    name?: StringWithAggregatesFilter<"Issuer"> | string
    domain?: StringNullableWithAggregatesFilter<"Issuer"> | string | null
    issuerType?: StringWithAggregatesFilter<"Issuer"> | string
    trustStatus?: EnumIssuerTrustStatusWithAggregatesFilter<"Issuer"> | $Enums.IssuerTrustStatus
    createdAt?: DateTimeWithAggregatesFilter<"Issuer"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Issuer"> | Date | string
  }

  export type SubjectWhereInput = {
    AND?: SubjectWhereInput | SubjectWhereInput[]
    OR?: SubjectWhereInput[]
    NOT?: SubjectWhereInput | SubjectWhereInput[]
    id?: StringFilter<"Subject"> | string
    name?: StringFilter<"Subject"> | string
    email?: StringNullableFilter<"Subject"> | string | null
    externalIdentifier?: StringNullableFilter<"Subject"> | string | null
    createdAt?: DateTimeFilter<"Subject"> | Date | string
    credentials?: CredentialListRelationFilter
  }

  export type SubjectOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrderInput | SortOrder
    externalIdentifier?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    credentials?: CredentialOrderByRelationAggregateInput
  }

  export type SubjectWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SubjectWhereInput | SubjectWhereInput[]
    OR?: SubjectWhereInput[]
    NOT?: SubjectWhereInput | SubjectWhereInput[]
    name?: StringFilter<"Subject"> | string
    email?: StringNullableFilter<"Subject"> | string | null
    externalIdentifier?: StringNullableFilter<"Subject"> | string | null
    createdAt?: DateTimeFilter<"Subject"> | Date | string
    credentials?: CredentialListRelationFilter
  }, "id">

  export type SubjectOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrderInput | SortOrder
    externalIdentifier?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: SubjectCountOrderByAggregateInput
    _max?: SubjectMaxOrderByAggregateInput
    _min?: SubjectMinOrderByAggregateInput
  }

  export type SubjectScalarWhereWithAggregatesInput = {
    AND?: SubjectScalarWhereWithAggregatesInput | SubjectScalarWhereWithAggregatesInput[]
    OR?: SubjectScalarWhereWithAggregatesInput[]
    NOT?: SubjectScalarWhereWithAggregatesInput | SubjectScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Subject"> | string
    name?: StringWithAggregatesFilter<"Subject"> | string
    email?: StringNullableWithAggregatesFilter<"Subject"> | string | null
    externalIdentifier?: StringNullableWithAggregatesFilter<"Subject"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Subject"> | Date | string
  }

  export type AchievementWhereInput = {
    AND?: AchievementWhereInput | AchievementWhereInput[]
    OR?: AchievementWhereInput[]
    NOT?: AchievementWhereInput | AchievementWhereInput[]
    id?: StringFilter<"Achievement"> | string
    name?: StringFilter<"Achievement"> | string
    description?: StringNullableFilter<"Achievement"> | string | null
    credentialType?: EnumCredentialTypeFilter<"Achievement"> | $Enums.CredentialType
    level?: StringNullableFilter<"Achievement"> | string | null
    skills?: StringNullableListFilter<"Achievement">
    framework?: StringNullableFilter<"Achievement"> | string | null
    credentials?: CredentialListRelationFilter
  }

  export type AchievementOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    credentialType?: SortOrder
    level?: SortOrderInput | SortOrder
    skills?: SortOrder
    framework?: SortOrderInput | SortOrder
    credentials?: CredentialOrderByRelationAggregateInput
  }

  export type AchievementWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AchievementWhereInput | AchievementWhereInput[]
    OR?: AchievementWhereInput[]
    NOT?: AchievementWhereInput | AchievementWhereInput[]
    name?: StringFilter<"Achievement"> | string
    description?: StringNullableFilter<"Achievement"> | string | null
    credentialType?: EnumCredentialTypeFilter<"Achievement"> | $Enums.CredentialType
    level?: StringNullableFilter<"Achievement"> | string | null
    skills?: StringNullableListFilter<"Achievement">
    framework?: StringNullableFilter<"Achievement"> | string | null
    credentials?: CredentialListRelationFilter
  }, "id">

  export type AchievementOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    credentialType?: SortOrder
    level?: SortOrderInput | SortOrder
    skills?: SortOrder
    framework?: SortOrderInput | SortOrder
    _count?: AchievementCountOrderByAggregateInput
    _max?: AchievementMaxOrderByAggregateInput
    _min?: AchievementMinOrderByAggregateInput
  }

  export type AchievementScalarWhereWithAggregatesInput = {
    AND?: AchievementScalarWhereWithAggregatesInput | AchievementScalarWhereWithAggregatesInput[]
    OR?: AchievementScalarWhereWithAggregatesInput[]
    NOT?: AchievementScalarWhereWithAggregatesInput | AchievementScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Achievement"> | string
    name?: StringWithAggregatesFilter<"Achievement"> | string
    description?: StringNullableWithAggregatesFilter<"Achievement"> | string | null
    credentialType?: EnumCredentialTypeWithAggregatesFilter<"Achievement"> | $Enums.CredentialType
    level?: StringNullableWithAggregatesFilter<"Achievement"> | string | null
    skills?: StringNullableListFilter<"Achievement">
    framework?: StringNullableWithAggregatesFilter<"Achievement"> | string | null
  }

  export type CredentialWhereInput = {
    AND?: CredentialWhereInput | CredentialWhereInput[]
    OR?: CredentialWhereInput[]
    NOT?: CredentialWhereInput | CredentialWhereInput[]
    id?: StringFilter<"Credential"> | string
    issuerId?: StringFilter<"Credential"> | string
    subjectId?: StringFilter<"Credential"> | string
    achievementId?: StringFilter<"Credential"> | string
    credentialType?: EnumCredentialTypeFilter<"Credential"> | $Enums.CredentialType
    issueDate?: DateTimeNullableFilter<"Credential"> | Date | string | null
    expirationDate?: DateTimeNullableFilter<"Credential"> | Date | string | null
    status?: EnumVerificationStatusFilter<"Credential"> | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFilter<"Credential"> | $Enums.CredentialInputType
    sourceIdentifier?: StringNullableFilter<"Credential"> | string | null
    rawMetadata?: JsonNullableFilter<"Credential">
    createdAt?: DateTimeFilter<"Credential"> | Date | string
    updatedAt?: DateTimeFilter<"Credential"> | Date | string
    issuer?: XOR<IssuerScalarRelationFilter, IssuerWhereInput>
    subject?: XOR<SubjectScalarRelationFilter, SubjectWhereInput>
    achievement?: XOR<AchievementScalarRelationFilter, AchievementWhereInput>
    verifications?: VerificationListRelationFilter
  }

  export type CredentialOrderByWithRelationInput = {
    id?: SortOrder
    issuerId?: SortOrder
    subjectId?: SortOrder
    achievementId?: SortOrder
    credentialType?: SortOrder
    issueDate?: SortOrderInput | SortOrder
    expirationDate?: SortOrderInput | SortOrder
    status?: SortOrder
    source?: SortOrder
    sourceIdentifier?: SortOrderInput | SortOrder
    rawMetadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    issuer?: IssuerOrderByWithRelationInput
    subject?: SubjectOrderByWithRelationInput
    achievement?: AchievementOrderByWithRelationInput
    verifications?: VerificationOrderByRelationAggregateInput
  }

  export type CredentialWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sourceIdentifier?: string
    AND?: CredentialWhereInput | CredentialWhereInput[]
    OR?: CredentialWhereInput[]
    NOT?: CredentialWhereInput | CredentialWhereInput[]
    issuerId?: StringFilter<"Credential"> | string
    subjectId?: StringFilter<"Credential"> | string
    achievementId?: StringFilter<"Credential"> | string
    credentialType?: EnumCredentialTypeFilter<"Credential"> | $Enums.CredentialType
    issueDate?: DateTimeNullableFilter<"Credential"> | Date | string | null
    expirationDate?: DateTimeNullableFilter<"Credential"> | Date | string | null
    status?: EnumVerificationStatusFilter<"Credential"> | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFilter<"Credential"> | $Enums.CredentialInputType
    rawMetadata?: JsonNullableFilter<"Credential">
    createdAt?: DateTimeFilter<"Credential"> | Date | string
    updatedAt?: DateTimeFilter<"Credential"> | Date | string
    issuer?: XOR<IssuerScalarRelationFilter, IssuerWhereInput>
    subject?: XOR<SubjectScalarRelationFilter, SubjectWhereInput>
    achievement?: XOR<AchievementScalarRelationFilter, AchievementWhereInput>
    verifications?: VerificationListRelationFilter
  }, "id" | "sourceIdentifier">

  export type CredentialOrderByWithAggregationInput = {
    id?: SortOrder
    issuerId?: SortOrder
    subjectId?: SortOrder
    achievementId?: SortOrder
    credentialType?: SortOrder
    issueDate?: SortOrderInput | SortOrder
    expirationDate?: SortOrderInput | SortOrder
    status?: SortOrder
    source?: SortOrder
    sourceIdentifier?: SortOrderInput | SortOrder
    rawMetadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CredentialCountOrderByAggregateInput
    _max?: CredentialMaxOrderByAggregateInput
    _min?: CredentialMinOrderByAggregateInput
  }

  export type CredentialScalarWhereWithAggregatesInput = {
    AND?: CredentialScalarWhereWithAggregatesInput | CredentialScalarWhereWithAggregatesInput[]
    OR?: CredentialScalarWhereWithAggregatesInput[]
    NOT?: CredentialScalarWhereWithAggregatesInput | CredentialScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Credential"> | string
    issuerId?: StringWithAggregatesFilter<"Credential"> | string
    subjectId?: StringWithAggregatesFilter<"Credential"> | string
    achievementId?: StringWithAggregatesFilter<"Credential"> | string
    credentialType?: EnumCredentialTypeWithAggregatesFilter<"Credential"> | $Enums.CredentialType
    issueDate?: DateTimeNullableWithAggregatesFilter<"Credential"> | Date | string | null
    expirationDate?: DateTimeNullableWithAggregatesFilter<"Credential"> | Date | string | null
    status?: EnumVerificationStatusWithAggregatesFilter<"Credential"> | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeWithAggregatesFilter<"Credential"> | $Enums.CredentialInputType
    sourceIdentifier?: StringNullableWithAggregatesFilter<"Credential"> | string | null
    rawMetadata?: JsonNullableWithAggregatesFilter<"Credential">
    createdAt?: DateTimeWithAggregatesFilter<"Credential"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Credential"> | Date | string
  }

  export type VerificationWhereInput = {
    AND?: VerificationWhereInput | VerificationWhereInput[]
    OR?: VerificationWhereInput[]
    NOT?: VerificationWhereInput | VerificationWhereInput[]
    id?: StringFilter<"Verification"> | string
    credentialId?: StringFilter<"Verification"> | string
    method?: EnumVerificationMethodFilter<"Verification"> | $Enums.VerificationMethod
    provider?: StringNullableFilter<"Verification"> | string | null
    verificationLevel?: EnumVerificationLevelFilter<"Verification"> | $Enums.VerificationLevel
    verifiedAt?: DateTimeNullableFilter<"Verification"> | Date | string | null
    adapterVersion?: StringFilter<"Verification"> | string
    evidenceUrl?: StringNullableFilter<"Verification"> | string | null
    rawResponse?: JsonNullableFilter<"Verification">
    createdAt?: DateTimeFilter<"Verification"> | Date | string
    credential?: XOR<CredentialScalarRelationFilter, CredentialWhereInput>
    checks?: VerificationCheckListRelationFilter
    evidence?: VerificationEvidenceListRelationFilter
    attempts?: VerificationAttemptListRelationFilter
  }

  export type VerificationOrderByWithRelationInput = {
    id?: SortOrder
    credentialId?: SortOrder
    method?: SortOrder
    provider?: SortOrderInput | SortOrder
    verificationLevel?: SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    adapterVersion?: SortOrder
    evidenceUrl?: SortOrderInput | SortOrder
    rawResponse?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    credential?: CredentialOrderByWithRelationInput
    checks?: VerificationCheckOrderByRelationAggregateInput
    evidence?: VerificationEvidenceOrderByRelationAggregateInput
    attempts?: VerificationAttemptOrderByRelationAggregateInput
  }

  export type VerificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VerificationWhereInput | VerificationWhereInput[]
    OR?: VerificationWhereInput[]
    NOT?: VerificationWhereInput | VerificationWhereInput[]
    credentialId?: StringFilter<"Verification"> | string
    method?: EnumVerificationMethodFilter<"Verification"> | $Enums.VerificationMethod
    provider?: StringNullableFilter<"Verification"> | string | null
    verificationLevel?: EnumVerificationLevelFilter<"Verification"> | $Enums.VerificationLevel
    verifiedAt?: DateTimeNullableFilter<"Verification"> | Date | string | null
    adapterVersion?: StringFilter<"Verification"> | string
    evidenceUrl?: StringNullableFilter<"Verification"> | string | null
    rawResponse?: JsonNullableFilter<"Verification">
    createdAt?: DateTimeFilter<"Verification"> | Date | string
    credential?: XOR<CredentialScalarRelationFilter, CredentialWhereInput>
    checks?: VerificationCheckListRelationFilter
    evidence?: VerificationEvidenceListRelationFilter
    attempts?: VerificationAttemptListRelationFilter
  }, "id">

  export type VerificationOrderByWithAggregationInput = {
    id?: SortOrder
    credentialId?: SortOrder
    method?: SortOrder
    provider?: SortOrderInput | SortOrder
    verificationLevel?: SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    adapterVersion?: SortOrder
    evidenceUrl?: SortOrderInput | SortOrder
    rawResponse?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: VerificationCountOrderByAggregateInput
    _max?: VerificationMaxOrderByAggregateInput
    _min?: VerificationMinOrderByAggregateInput
  }

  export type VerificationScalarWhereWithAggregatesInput = {
    AND?: VerificationScalarWhereWithAggregatesInput | VerificationScalarWhereWithAggregatesInput[]
    OR?: VerificationScalarWhereWithAggregatesInput[]
    NOT?: VerificationScalarWhereWithAggregatesInput | VerificationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Verification"> | string
    credentialId?: StringWithAggregatesFilter<"Verification"> | string
    method?: EnumVerificationMethodWithAggregatesFilter<"Verification"> | $Enums.VerificationMethod
    provider?: StringNullableWithAggregatesFilter<"Verification"> | string | null
    verificationLevel?: EnumVerificationLevelWithAggregatesFilter<"Verification"> | $Enums.VerificationLevel
    verifiedAt?: DateTimeNullableWithAggregatesFilter<"Verification"> | Date | string | null
    adapterVersion?: StringWithAggregatesFilter<"Verification"> | string
    evidenceUrl?: StringNullableWithAggregatesFilter<"Verification"> | string | null
    rawResponse?: JsonNullableWithAggregatesFilter<"Verification">
    createdAt?: DateTimeWithAggregatesFilter<"Verification"> | Date | string
  }

  export type VerificationCheckWhereInput = {
    AND?: VerificationCheckWhereInput | VerificationCheckWhereInput[]
    OR?: VerificationCheckWhereInput[]
    NOT?: VerificationCheckWhereInput | VerificationCheckWhereInput[]
    id?: StringFilter<"VerificationCheck"> | string
    verificationId?: StringFilter<"VerificationCheck"> | string
    checkName?: StringFilter<"VerificationCheck"> | string
    result?: EnumCheckResultFilter<"VerificationCheck"> | $Enums.CheckResult
    detail?: StringNullableFilter<"VerificationCheck"> | string | null
    verification?: XOR<VerificationScalarRelationFilter, VerificationWhereInput>
  }

  export type VerificationCheckOrderByWithRelationInput = {
    id?: SortOrder
    verificationId?: SortOrder
    checkName?: SortOrder
    result?: SortOrder
    detail?: SortOrderInput | SortOrder
    verification?: VerificationOrderByWithRelationInput
  }

  export type VerificationCheckWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VerificationCheckWhereInput | VerificationCheckWhereInput[]
    OR?: VerificationCheckWhereInput[]
    NOT?: VerificationCheckWhereInput | VerificationCheckWhereInput[]
    verificationId?: StringFilter<"VerificationCheck"> | string
    checkName?: StringFilter<"VerificationCheck"> | string
    result?: EnumCheckResultFilter<"VerificationCheck"> | $Enums.CheckResult
    detail?: StringNullableFilter<"VerificationCheck"> | string | null
    verification?: XOR<VerificationScalarRelationFilter, VerificationWhereInput>
  }, "id">

  export type VerificationCheckOrderByWithAggregationInput = {
    id?: SortOrder
    verificationId?: SortOrder
    checkName?: SortOrder
    result?: SortOrder
    detail?: SortOrderInput | SortOrder
    _count?: VerificationCheckCountOrderByAggregateInput
    _max?: VerificationCheckMaxOrderByAggregateInput
    _min?: VerificationCheckMinOrderByAggregateInput
  }

  export type VerificationCheckScalarWhereWithAggregatesInput = {
    AND?: VerificationCheckScalarWhereWithAggregatesInput | VerificationCheckScalarWhereWithAggregatesInput[]
    OR?: VerificationCheckScalarWhereWithAggregatesInput[]
    NOT?: VerificationCheckScalarWhereWithAggregatesInput | VerificationCheckScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VerificationCheck"> | string
    verificationId?: StringWithAggregatesFilter<"VerificationCheck"> | string
    checkName?: StringWithAggregatesFilter<"VerificationCheck"> | string
    result?: EnumCheckResultWithAggregatesFilter<"VerificationCheck"> | $Enums.CheckResult
    detail?: StringNullableWithAggregatesFilter<"VerificationCheck"> | string | null
  }

  export type VerificationEvidenceWhereInput = {
    AND?: VerificationEvidenceWhereInput | VerificationEvidenceWhereInput[]
    OR?: VerificationEvidenceWhereInput[]
    NOT?: VerificationEvidenceWhereInput | VerificationEvidenceWhereInput[]
    id?: StringFilter<"VerificationEvidence"> | string
    verificationId?: StringFilter<"VerificationEvidence"> | string
    evidenceType?: StringFilter<"VerificationEvidence"> | string
    url?: StringNullableFilter<"VerificationEvidence"> | string | null
    fileRef?: StringNullableFilter<"VerificationEvidence"> | string | null
    metadata?: JsonNullableFilter<"VerificationEvidence">
    verification?: XOR<VerificationScalarRelationFilter, VerificationWhereInput>
  }

  export type VerificationEvidenceOrderByWithRelationInput = {
    id?: SortOrder
    verificationId?: SortOrder
    evidenceType?: SortOrder
    url?: SortOrderInput | SortOrder
    fileRef?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    verification?: VerificationOrderByWithRelationInput
  }

  export type VerificationEvidenceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VerificationEvidenceWhereInput | VerificationEvidenceWhereInput[]
    OR?: VerificationEvidenceWhereInput[]
    NOT?: VerificationEvidenceWhereInput | VerificationEvidenceWhereInput[]
    verificationId?: StringFilter<"VerificationEvidence"> | string
    evidenceType?: StringFilter<"VerificationEvidence"> | string
    url?: StringNullableFilter<"VerificationEvidence"> | string | null
    fileRef?: StringNullableFilter<"VerificationEvidence"> | string | null
    metadata?: JsonNullableFilter<"VerificationEvidence">
    verification?: XOR<VerificationScalarRelationFilter, VerificationWhereInput>
  }, "id">

  export type VerificationEvidenceOrderByWithAggregationInput = {
    id?: SortOrder
    verificationId?: SortOrder
    evidenceType?: SortOrder
    url?: SortOrderInput | SortOrder
    fileRef?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    _count?: VerificationEvidenceCountOrderByAggregateInput
    _max?: VerificationEvidenceMaxOrderByAggregateInput
    _min?: VerificationEvidenceMinOrderByAggregateInput
  }

  export type VerificationEvidenceScalarWhereWithAggregatesInput = {
    AND?: VerificationEvidenceScalarWhereWithAggregatesInput | VerificationEvidenceScalarWhereWithAggregatesInput[]
    OR?: VerificationEvidenceScalarWhereWithAggregatesInput[]
    NOT?: VerificationEvidenceScalarWhereWithAggregatesInput | VerificationEvidenceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VerificationEvidence"> | string
    verificationId?: StringWithAggregatesFilter<"VerificationEvidence"> | string
    evidenceType?: StringWithAggregatesFilter<"VerificationEvidence"> | string
    url?: StringNullableWithAggregatesFilter<"VerificationEvidence"> | string | null
    fileRef?: StringNullableWithAggregatesFilter<"VerificationEvidence"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"VerificationEvidence">
  }

  export type VerificationAttemptWhereInput = {
    AND?: VerificationAttemptWhereInput | VerificationAttemptWhereInput[]
    OR?: VerificationAttemptWhereInput[]
    NOT?: VerificationAttemptWhereInput | VerificationAttemptWhereInput[]
    id?: StringFilter<"VerificationAttempt"> | string
    verificationId?: StringFilter<"VerificationAttempt"> | string
    attemptedAt?: DateTimeFilter<"VerificationAttempt"> | Date | string
    outcome?: StringFilter<"VerificationAttempt"> | string
    error?: StringNullableFilter<"VerificationAttempt"> | string | null
    durationMs?: IntNullableFilter<"VerificationAttempt"> | number | null
    verification?: XOR<VerificationScalarRelationFilter, VerificationWhereInput>
  }

  export type VerificationAttemptOrderByWithRelationInput = {
    id?: SortOrder
    verificationId?: SortOrder
    attemptedAt?: SortOrder
    outcome?: SortOrder
    error?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    verification?: VerificationOrderByWithRelationInput
  }

  export type VerificationAttemptWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VerificationAttemptWhereInput | VerificationAttemptWhereInput[]
    OR?: VerificationAttemptWhereInput[]
    NOT?: VerificationAttemptWhereInput | VerificationAttemptWhereInput[]
    verificationId?: StringFilter<"VerificationAttempt"> | string
    attemptedAt?: DateTimeFilter<"VerificationAttempt"> | Date | string
    outcome?: StringFilter<"VerificationAttempt"> | string
    error?: StringNullableFilter<"VerificationAttempt"> | string | null
    durationMs?: IntNullableFilter<"VerificationAttempt"> | number | null
    verification?: XOR<VerificationScalarRelationFilter, VerificationWhereInput>
  }, "id">

  export type VerificationAttemptOrderByWithAggregationInput = {
    id?: SortOrder
    verificationId?: SortOrder
    attemptedAt?: SortOrder
    outcome?: SortOrder
    error?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    _count?: VerificationAttemptCountOrderByAggregateInput
    _avg?: VerificationAttemptAvgOrderByAggregateInput
    _max?: VerificationAttemptMaxOrderByAggregateInput
    _min?: VerificationAttemptMinOrderByAggregateInput
    _sum?: VerificationAttemptSumOrderByAggregateInput
  }

  export type VerificationAttemptScalarWhereWithAggregatesInput = {
    AND?: VerificationAttemptScalarWhereWithAggregatesInput | VerificationAttemptScalarWhereWithAggregatesInput[]
    OR?: VerificationAttemptScalarWhereWithAggregatesInput[]
    NOT?: VerificationAttemptScalarWhereWithAggregatesInput | VerificationAttemptScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VerificationAttempt"> | string
    verificationId?: StringWithAggregatesFilter<"VerificationAttempt"> | string
    attemptedAt?: DateTimeWithAggregatesFilter<"VerificationAttempt"> | Date | string
    outcome?: StringWithAggregatesFilter<"VerificationAttempt"> | string
    error?: StringNullableWithAggregatesFilter<"VerificationAttempt"> | string | null
    durationMs?: IntNullableWithAggregatesFilter<"VerificationAttempt"> | number | null
  }

  export type IssuerAdapterWhereInput = {
    AND?: IssuerAdapterWhereInput | IssuerAdapterWhereInput[]
    OR?: IssuerAdapterWhereInput[]
    NOT?: IssuerAdapterWhereInput | IssuerAdapterWhereInput[]
    id?: StringFilter<"IssuerAdapter"> | string
    issuerId?: StringNullableFilter<"IssuerAdapter"> | string | null
    adapterName?: StringFilter<"IssuerAdapter"> | string
    integrationType?: EnumIntegrationTypeFilter<"IssuerAdapter"> | $Enums.IntegrationType
    capabilities?: JsonFilter<"IssuerAdapter">
    confidence?: EnumConfidenceLevelNullableFilter<"IssuerAdapter"> | $Enums.ConfidenceLevel | null
    notes?: StringNullableFilter<"IssuerAdapter"> | string | null
    updatedAt?: DateTimeFilter<"IssuerAdapter"> | Date | string
    issuer?: XOR<IssuerNullableScalarRelationFilter, IssuerWhereInput> | null
  }

  export type IssuerAdapterOrderByWithRelationInput = {
    id?: SortOrder
    issuerId?: SortOrderInput | SortOrder
    adapterName?: SortOrder
    integrationType?: SortOrder
    capabilities?: SortOrder
    confidence?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    issuer?: IssuerOrderByWithRelationInput
  }

  export type IssuerAdapterWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: IssuerAdapterWhereInput | IssuerAdapterWhereInput[]
    OR?: IssuerAdapterWhereInput[]
    NOT?: IssuerAdapterWhereInput | IssuerAdapterWhereInput[]
    issuerId?: StringNullableFilter<"IssuerAdapter"> | string | null
    adapterName?: StringFilter<"IssuerAdapter"> | string
    integrationType?: EnumIntegrationTypeFilter<"IssuerAdapter"> | $Enums.IntegrationType
    capabilities?: JsonFilter<"IssuerAdapter">
    confidence?: EnumConfidenceLevelNullableFilter<"IssuerAdapter"> | $Enums.ConfidenceLevel | null
    notes?: StringNullableFilter<"IssuerAdapter"> | string | null
    updatedAt?: DateTimeFilter<"IssuerAdapter"> | Date | string
    issuer?: XOR<IssuerNullableScalarRelationFilter, IssuerWhereInput> | null
  }, "id">

  export type IssuerAdapterOrderByWithAggregationInput = {
    id?: SortOrder
    issuerId?: SortOrderInput | SortOrder
    adapterName?: SortOrder
    integrationType?: SortOrder
    capabilities?: SortOrder
    confidence?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    _count?: IssuerAdapterCountOrderByAggregateInput
    _max?: IssuerAdapterMaxOrderByAggregateInput
    _min?: IssuerAdapterMinOrderByAggregateInput
  }

  export type IssuerAdapterScalarWhereWithAggregatesInput = {
    AND?: IssuerAdapterScalarWhereWithAggregatesInput | IssuerAdapterScalarWhereWithAggregatesInput[]
    OR?: IssuerAdapterScalarWhereWithAggregatesInput[]
    NOT?: IssuerAdapterScalarWhereWithAggregatesInput | IssuerAdapterScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"IssuerAdapter"> | string
    issuerId?: StringNullableWithAggregatesFilter<"IssuerAdapter"> | string | null
    adapterName?: StringWithAggregatesFilter<"IssuerAdapter"> | string
    integrationType?: EnumIntegrationTypeWithAggregatesFilter<"IssuerAdapter"> | $Enums.IntegrationType
    capabilities?: JsonWithAggregatesFilter<"IssuerAdapter">
    confidence?: EnumConfidenceLevelNullableWithAggregatesFilter<"IssuerAdapter"> | $Enums.ConfidenceLevel | null
    notes?: StringNullableWithAggregatesFilter<"IssuerAdapter"> | string | null
    updatedAt?: DateTimeWithAggregatesFilter<"IssuerAdapter"> | Date | string
  }

  export type TrustRegistryEntryWhereInput = {
    AND?: TrustRegistryEntryWhereInput | TrustRegistryEntryWhereInput[]
    OR?: TrustRegistryEntryWhereInput[]
    NOT?: TrustRegistryEntryWhereInput | TrustRegistryEntryWhereInput[]
    id?: StringFilter<"TrustRegistryEntry"> | string
    issuerId?: StringNullableFilter<"TrustRegistryEntry"> | string | null
    platformName?: StringNullableFilter<"TrustRegistryEntry"> | string | null
    trustLevel?: StringFilter<"TrustRegistryEntry"> | string
    notes?: StringNullableFilter<"TrustRegistryEntry"> | string | null
    updatedAt?: DateTimeFilter<"TrustRegistryEntry"> | Date | string
    issuer?: XOR<IssuerNullableScalarRelationFilter, IssuerWhereInput> | null
  }

  export type TrustRegistryEntryOrderByWithRelationInput = {
    id?: SortOrder
    issuerId?: SortOrderInput | SortOrder
    platformName?: SortOrderInput | SortOrder
    trustLevel?: SortOrder
    notes?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    issuer?: IssuerOrderByWithRelationInput
  }

  export type TrustRegistryEntryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TrustRegistryEntryWhereInput | TrustRegistryEntryWhereInput[]
    OR?: TrustRegistryEntryWhereInput[]
    NOT?: TrustRegistryEntryWhereInput | TrustRegistryEntryWhereInput[]
    issuerId?: StringNullableFilter<"TrustRegistryEntry"> | string | null
    platformName?: StringNullableFilter<"TrustRegistryEntry"> | string | null
    trustLevel?: StringFilter<"TrustRegistryEntry"> | string
    notes?: StringNullableFilter<"TrustRegistryEntry"> | string | null
    updatedAt?: DateTimeFilter<"TrustRegistryEntry"> | Date | string
    issuer?: XOR<IssuerNullableScalarRelationFilter, IssuerWhereInput> | null
  }, "id">

  export type TrustRegistryEntryOrderByWithAggregationInput = {
    id?: SortOrder
    issuerId?: SortOrderInput | SortOrder
    platformName?: SortOrderInput | SortOrder
    trustLevel?: SortOrder
    notes?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    _count?: TrustRegistryEntryCountOrderByAggregateInput
    _max?: TrustRegistryEntryMaxOrderByAggregateInput
    _min?: TrustRegistryEntryMinOrderByAggregateInput
  }

  export type TrustRegistryEntryScalarWhereWithAggregatesInput = {
    AND?: TrustRegistryEntryScalarWhereWithAggregatesInput | TrustRegistryEntryScalarWhereWithAggregatesInput[]
    OR?: TrustRegistryEntryScalarWhereWithAggregatesInput[]
    NOT?: TrustRegistryEntryScalarWhereWithAggregatesInput | TrustRegistryEntryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TrustRegistryEntry"> | string
    issuerId?: StringNullableWithAggregatesFilter<"TrustRegistryEntry"> | string | null
    platformName?: StringNullableWithAggregatesFilter<"TrustRegistryEntry"> | string | null
    trustLevel?: StringWithAggregatesFilter<"TrustRegistryEntry"> | string
    notes?: StringNullableWithAggregatesFilter<"TrustRegistryEntry"> | string | null
    updatedAt?: DateTimeWithAggregatesFilter<"TrustRegistryEntry"> | Date | string
  }

  export type IssuerCreateInput = {
    id?: string
    name: string
    domain?: string | null
    issuerType: string
    trustStatus?: $Enums.IssuerTrustStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    credentials?: CredentialCreateNestedManyWithoutIssuerInput
    adapters?: IssuerAdapterCreateNestedManyWithoutIssuerInput
    trustRegistry?: TrustRegistryEntryCreateNestedManyWithoutIssuerInput
  }

  export type IssuerUncheckedCreateInput = {
    id?: string
    name: string
    domain?: string | null
    issuerType: string
    trustStatus?: $Enums.IssuerTrustStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    credentials?: CredentialUncheckedCreateNestedManyWithoutIssuerInput
    adapters?: IssuerAdapterUncheckedCreateNestedManyWithoutIssuerInput
    trustRegistry?: TrustRegistryEntryUncheckedCreateNestedManyWithoutIssuerInput
  }

  export type IssuerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUpdateManyWithoutIssuerNestedInput
    adapters?: IssuerAdapterUpdateManyWithoutIssuerNestedInput
    trustRegistry?: TrustRegistryEntryUpdateManyWithoutIssuerNestedInput
  }

  export type IssuerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUncheckedUpdateManyWithoutIssuerNestedInput
    adapters?: IssuerAdapterUncheckedUpdateManyWithoutIssuerNestedInput
    trustRegistry?: TrustRegistryEntryUncheckedUpdateManyWithoutIssuerNestedInput
  }

  export type IssuerCreateManyInput = {
    id?: string
    name: string
    domain?: string | null
    issuerType: string
    trustStatus?: $Enums.IssuerTrustStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type IssuerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IssuerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubjectCreateInput = {
    id?: string
    name: string
    email?: string | null
    externalIdentifier?: string | null
    createdAt?: Date | string
    credentials?: CredentialCreateNestedManyWithoutSubjectInput
  }

  export type SubjectUncheckedCreateInput = {
    id?: string
    name: string
    email?: string | null
    externalIdentifier?: string | null
    createdAt?: Date | string
    credentials?: CredentialUncheckedCreateNestedManyWithoutSubjectInput
  }

  export type SubjectUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    externalIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUpdateManyWithoutSubjectNestedInput
  }

  export type SubjectUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    externalIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUncheckedUpdateManyWithoutSubjectNestedInput
  }

  export type SubjectCreateManyInput = {
    id?: string
    name: string
    email?: string | null
    externalIdentifier?: string | null
    createdAt?: Date | string
  }

  export type SubjectUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    externalIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubjectUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    externalIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AchievementCreateInput = {
    id?: string
    name: string
    description?: string | null
    credentialType: $Enums.CredentialType
    level?: string | null
    skills?: AchievementCreateskillsInput | string[]
    framework?: string | null
    credentials?: CredentialCreateNestedManyWithoutAchievementInput
  }

  export type AchievementUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    credentialType: $Enums.CredentialType
    level?: string | null
    skills?: AchievementCreateskillsInput | string[]
    framework?: string | null
    credentials?: CredentialUncheckedCreateNestedManyWithoutAchievementInput
  }

  export type AchievementUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    level?: NullableStringFieldUpdateOperationsInput | string | null
    skills?: AchievementUpdateskillsInput | string[]
    framework?: NullableStringFieldUpdateOperationsInput | string | null
    credentials?: CredentialUpdateManyWithoutAchievementNestedInput
  }

  export type AchievementUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    level?: NullableStringFieldUpdateOperationsInput | string | null
    skills?: AchievementUpdateskillsInput | string[]
    framework?: NullableStringFieldUpdateOperationsInput | string | null
    credentials?: CredentialUncheckedUpdateManyWithoutAchievementNestedInput
  }

  export type AchievementCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    credentialType: $Enums.CredentialType
    level?: string | null
    skills?: AchievementCreateskillsInput | string[]
    framework?: string | null
  }

  export type AchievementUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    level?: NullableStringFieldUpdateOperationsInput | string | null
    skills?: AchievementUpdateskillsInput | string[]
    framework?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AchievementUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    level?: NullableStringFieldUpdateOperationsInput | string | null
    skills?: AchievementUpdateskillsInput | string[]
    framework?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CredentialCreateInput = {
    id?: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    issuer: IssuerCreateNestedOneWithoutCredentialsInput
    subject: SubjectCreateNestedOneWithoutCredentialsInput
    achievement: AchievementCreateNestedOneWithoutCredentialsInput
    verifications?: VerificationCreateNestedManyWithoutCredentialInput
  }

  export type CredentialUncheckedCreateInput = {
    id?: string
    issuerId: string
    subjectId: string
    achievementId: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    verifications?: VerificationUncheckedCreateNestedManyWithoutCredentialInput
  }

  export type CredentialUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuer?: IssuerUpdateOneRequiredWithoutCredentialsNestedInput
    subject?: SubjectUpdateOneRequiredWithoutCredentialsNestedInput
    achievement?: AchievementUpdateOneRequiredWithoutCredentialsNestedInput
    verifications?: VerificationUpdateManyWithoutCredentialNestedInput
  }

  export type CredentialUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    achievementId?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    verifications?: VerificationUncheckedUpdateManyWithoutCredentialNestedInput
  }

  export type CredentialCreateManyInput = {
    id?: string
    issuerId: string
    subjectId: string
    achievementId: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CredentialUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CredentialUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    achievementId?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCreateInput = {
    id?: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    credential: CredentialCreateNestedOneWithoutVerificationsInput
    checks?: VerificationCheckCreateNestedManyWithoutVerificationInput
    evidence?: VerificationEvidenceCreateNestedManyWithoutVerificationInput
    attempts?: VerificationAttemptCreateNestedManyWithoutVerificationInput
  }

  export type VerificationUncheckedCreateInput = {
    id?: string
    credentialId: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    checks?: VerificationCheckUncheckedCreateNestedManyWithoutVerificationInput
    evidence?: VerificationEvidenceUncheckedCreateNestedManyWithoutVerificationInput
    attempts?: VerificationAttemptUncheckedCreateNestedManyWithoutVerificationInput
  }

  export type VerificationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credential?: CredentialUpdateOneRequiredWithoutVerificationsNestedInput
    checks?: VerificationCheckUpdateManyWithoutVerificationNestedInput
    evidence?: VerificationEvidenceUpdateManyWithoutVerificationNestedInput
    attempts?: VerificationAttemptUpdateManyWithoutVerificationNestedInput
  }

  export type VerificationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialId?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checks?: VerificationCheckUncheckedUpdateManyWithoutVerificationNestedInput
    evidence?: VerificationEvidenceUncheckedUpdateManyWithoutVerificationNestedInput
    attempts?: VerificationAttemptUncheckedUpdateManyWithoutVerificationNestedInput
  }

  export type VerificationCreateManyInput = {
    id?: string
    credentialId: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type VerificationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialId?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCheckCreateInput = {
    id?: string
    checkName: string
    result: $Enums.CheckResult
    detail?: string | null
    verification: VerificationCreateNestedOneWithoutChecksInput
  }

  export type VerificationCheckUncheckedCreateInput = {
    id?: string
    verificationId: string
    checkName: string
    result: $Enums.CheckResult
    detail?: string | null
  }

  export type VerificationCheckUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkName?: StringFieldUpdateOperationsInput | string
    result?: EnumCheckResultFieldUpdateOperationsInput | $Enums.CheckResult
    detail?: NullableStringFieldUpdateOperationsInput | string | null
    verification?: VerificationUpdateOneRequiredWithoutChecksNestedInput
  }

  export type VerificationCheckUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    verificationId?: StringFieldUpdateOperationsInput | string
    checkName?: StringFieldUpdateOperationsInput | string
    result?: EnumCheckResultFieldUpdateOperationsInput | $Enums.CheckResult
    detail?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type VerificationCheckCreateManyInput = {
    id?: string
    verificationId: string
    checkName: string
    result: $Enums.CheckResult
    detail?: string | null
  }

  export type VerificationCheckUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkName?: StringFieldUpdateOperationsInput | string
    result?: EnumCheckResultFieldUpdateOperationsInput | $Enums.CheckResult
    detail?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type VerificationCheckUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    verificationId?: StringFieldUpdateOperationsInput | string
    checkName?: StringFieldUpdateOperationsInput | string
    result?: EnumCheckResultFieldUpdateOperationsInput | $Enums.CheckResult
    detail?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type VerificationEvidenceCreateInput = {
    id?: string
    evidenceType: string
    url?: string | null
    fileRef?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    verification: VerificationCreateNestedOneWithoutEvidenceInput
  }

  export type VerificationEvidenceUncheckedCreateInput = {
    id?: string
    verificationId: string
    evidenceType: string
    url?: string | null
    fileRef?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationEvidenceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    evidenceType?: StringFieldUpdateOperationsInput | string
    url?: NullableStringFieldUpdateOperationsInput | string | null
    fileRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    verification?: VerificationUpdateOneRequiredWithoutEvidenceNestedInput
  }

  export type VerificationEvidenceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    verificationId?: StringFieldUpdateOperationsInput | string
    evidenceType?: StringFieldUpdateOperationsInput | string
    url?: NullableStringFieldUpdateOperationsInput | string | null
    fileRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationEvidenceCreateManyInput = {
    id?: string
    verificationId: string
    evidenceType: string
    url?: string | null
    fileRef?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationEvidenceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    evidenceType?: StringFieldUpdateOperationsInput | string
    url?: NullableStringFieldUpdateOperationsInput | string | null
    fileRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationEvidenceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    verificationId?: StringFieldUpdateOperationsInput | string
    evidenceType?: StringFieldUpdateOperationsInput | string
    url?: NullableStringFieldUpdateOperationsInput | string | null
    fileRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationAttemptCreateInput = {
    id?: string
    attemptedAt?: Date | string
    outcome: string
    error?: string | null
    durationMs?: number | null
    verification: VerificationCreateNestedOneWithoutAttemptsInput
  }

  export type VerificationAttemptUncheckedCreateInput = {
    id?: string
    verificationId: string
    attemptedAt?: Date | string
    outcome: string
    error?: string | null
    durationMs?: number | null
  }

  export type VerificationAttemptUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    attemptedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    verification?: VerificationUpdateOneRequiredWithoutAttemptsNestedInput
  }

  export type VerificationAttemptUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    verificationId?: StringFieldUpdateOperationsInput | string
    attemptedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type VerificationAttemptCreateManyInput = {
    id?: string
    verificationId: string
    attemptedAt?: Date | string
    outcome: string
    error?: string | null
    durationMs?: number | null
  }

  export type VerificationAttemptUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    attemptedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type VerificationAttemptUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    verificationId?: StringFieldUpdateOperationsInput | string
    attemptedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type IssuerAdapterCreateInput = {
    id?: string
    adapterName: string
    integrationType: $Enums.IntegrationType
    capabilities: JsonNullValueInput | InputJsonValue
    confidence?: $Enums.ConfidenceLevel | null
    notes?: string | null
    updatedAt?: Date | string
    issuer?: IssuerCreateNestedOneWithoutAdaptersInput
  }

  export type IssuerAdapterUncheckedCreateInput = {
    id?: string
    issuerId?: string | null
    adapterName: string
    integrationType: $Enums.IntegrationType
    capabilities: JsonNullValueInput | InputJsonValue
    confidence?: $Enums.ConfidenceLevel | null
    notes?: string | null
    updatedAt?: Date | string
  }

  export type IssuerAdapterUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    adapterName?: StringFieldUpdateOperationsInput | string
    integrationType?: EnumIntegrationTypeFieldUpdateOperationsInput | $Enums.IntegrationType
    capabilities?: JsonNullValueInput | InputJsonValue
    confidence?: NullableEnumConfidenceLevelFieldUpdateOperationsInput | $Enums.ConfidenceLevel | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuer?: IssuerUpdateOneWithoutAdaptersNestedInput
  }

  export type IssuerAdapterUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: NullableStringFieldUpdateOperationsInput | string | null
    adapterName?: StringFieldUpdateOperationsInput | string
    integrationType?: EnumIntegrationTypeFieldUpdateOperationsInput | $Enums.IntegrationType
    capabilities?: JsonNullValueInput | InputJsonValue
    confidence?: NullableEnumConfidenceLevelFieldUpdateOperationsInput | $Enums.ConfidenceLevel | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IssuerAdapterCreateManyInput = {
    id?: string
    issuerId?: string | null
    adapterName: string
    integrationType: $Enums.IntegrationType
    capabilities: JsonNullValueInput | InputJsonValue
    confidence?: $Enums.ConfidenceLevel | null
    notes?: string | null
    updatedAt?: Date | string
  }

  export type IssuerAdapterUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    adapterName?: StringFieldUpdateOperationsInput | string
    integrationType?: EnumIntegrationTypeFieldUpdateOperationsInput | $Enums.IntegrationType
    capabilities?: JsonNullValueInput | InputJsonValue
    confidence?: NullableEnumConfidenceLevelFieldUpdateOperationsInput | $Enums.ConfidenceLevel | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IssuerAdapterUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: NullableStringFieldUpdateOperationsInput | string | null
    adapterName?: StringFieldUpdateOperationsInput | string
    integrationType?: EnumIntegrationTypeFieldUpdateOperationsInput | $Enums.IntegrationType
    capabilities?: JsonNullValueInput | InputJsonValue
    confidence?: NullableEnumConfidenceLevelFieldUpdateOperationsInput | $Enums.ConfidenceLevel | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TrustRegistryEntryCreateInput = {
    id?: string
    platformName?: string | null
    trustLevel: string
    notes?: string | null
    updatedAt?: Date | string
    issuer?: IssuerCreateNestedOneWithoutTrustRegistryInput
  }

  export type TrustRegistryEntryUncheckedCreateInput = {
    id?: string
    issuerId?: string | null
    platformName?: string | null
    trustLevel: string
    notes?: string | null
    updatedAt?: Date | string
  }

  export type TrustRegistryEntryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    platformName?: NullableStringFieldUpdateOperationsInput | string | null
    trustLevel?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuer?: IssuerUpdateOneWithoutTrustRegistryNestedInput
  }

  export type TrustRegistryEntryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: NullableStringFieldUpdateOperationsInput | string | null
    platformName?: NullableStringFieldUpdateOperationsInput | string | null
    trustLevel?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TrustRegistryEntryCreateManyInput = {
    id?: string
    issuerId?: string | null
    platformName?: string | null
    trustLevel: string
    notes?: string | null
    updatedAt?: Date | string
  }

  export type TrustRegistryEntryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    platformName?: NullableStringFieldUpdateOperationsInput | string | null
    trustLevel?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TrustRegistryEntryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: NullableStringFieldUpdateOperationsInput | string | null
    platformName?: NullableStringFieldUpdateOperationsInput | string | null
    trustLevel?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumIssuerTrustStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.IssuerTrustStatus | EnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IssuerTrustStatus[] | ListEnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IssuerTrustStatus[] | ListEnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIssuerTrustStatusFilter<$PrismaModel> | $Enums.IssuerTrustStatus
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type CredentialListRelationFilter = {
    every?: CredentialWhereInput
    some?: CredentialWhereInput
    none?: CredentialWhereInput
  }

  export type IssuerAdapterListRelationFilter = {
    every?: IssuerAdapterWhereInput
    some?: IssuerAdapterWhereInput
    none?: IssuerAdapterWhereInput
  }

  export type TrustRegistryEntryListRelationFilter = {
    every?: TrustRegistryEntryWhereInput
    some?: TrustRegistryEntryWhereInput
    none?: TrustRegistryEntryWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CredentialOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IssuerAdapterOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TrustRegistryEntryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IssuerCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    domain?: SortOrder
    issuerType?: SortOrder
    trustStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IssuerMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    domain?: SortOrder
    issuerType?: SortOrder
    trustStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IssuerMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    domain?: SortOrder
    issuerType?: SortOrder
    trustStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumIssuerTrustStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IssuerTrustStatus | EnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IssuerTrustStatus[] | ListEnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IssuerTrustStatus[] | ListEnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIssuerTrustStatusWithAggregatesFilter<$PrismaModel> | $Enums.IssuerTrustStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIssuerTrustStatusFilter<$PrismaModel>
    _max?: NestedEnumIssuerTrustStatusFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type SubjectCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    externalIdentifier?: SortOrder
    createdAt?: SortOrder
  }

  export type SubjectMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    externalIdentifier?: SortOrder
    createdAt?: SortOrder
  }

  export type SubjectMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    externalIdentifier?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumCredentialTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialType | EnumCredentialTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialTypeFilter<$PrismaModel> | $Enums.CredentialType
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type AchievementCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    credentialType?: SortOrder
    level?: SortOrder
    skills?: SortOrder
    framework?: SortOrder
  }

  export type AchievementMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    credentialType?: SortOrder
    level?: SortOrder
    framework?: SortOrder
  }

  export type AchievementMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    credentialType?: SortOrder
    level?: SortOrder
    framework?: SortOrder
  }

  export type EnumCredentialTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialType | EnumCredentialTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialTypeWithAggregatesFilter<$PrismaModel> | $Enums.CredentialType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCredentialTypeFilter<$PrismaModel>
    _max?: NestedEnumCredentialTypeFilter<$PrismaModel>
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type EnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus
  }

  export type EnumCredentialInputTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialInputType | EnumCredentialInputTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialInputType[] | ListEnumCredentialInputTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialInputType[] | ListEnumCredentialInputTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialInputTypeFilter<$PrismaModel> | $Enums.CredentialInputType
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type IssuerScalarRelationFilter = {
    is?: IssuerWhereInput
    isNot?: IssuerWhereInput
  }

  export type SubjectScalarRelationFilter = {
    is?: SubjectWhereInput
    isNot?: SubjectWhereInput
  }

  export type AchievementScalarRelationFilter = {
    is?: AchievementWhereInput
    isNot?: AchievementWhereInput
  }

  export type VerificationListRelationFilter = {
    every?: VerificationWhereInput
    some?: VerificationWhereInput
    none?: VerificationWhereInput
  }

  export type VerificationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CredentialCountOrderByAggregateInput = {
    id?: SortOrder
    issuerId?: SortOrder
    subjectId?: SortOrder
    achievementId?: SortOrder
    credentialType?: SortOrder
    issueDate?: SortOrder
    expirationDate?: SortOrder
    status?: SortOrder
    source?: SortOrder
    sourceIdentifier?: SortOrder
    rawMetadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CredentialMaxOrderByAggregateInput = {
    id?: SortOrder
    issuerId?: SortOrder
    subjectId?: SortOrder
    achievementId?: SortOrder
    credentialType?: SortOrder
    issueDate?: SortOrder
    expirationDate?: SortOrder
    status?: SortOrder
    source?: SortOrder
    sourceIdentifier?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CredentialMinOrderByAggregateInput = {
    id?: SortOrder
    issuerId?: SortOrder
    subjectId?: SortOrder
    achievementId?: SortOrder
    credentialType?: SortOrder
    issueDate?: SortOrder
    expirationDate?: SortOrder
    status?: SortOrder
    source?: SortOrder
    sourceIdentifier?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationStatusFilter<$PrismaModel>
    _max?: NestedEnumVerificationStatusFilter<$PrismaModel>
  }

  export type EnumCredentialInputTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialInputType | EnumCredentialInputTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialInputType[] | ListEnumCredentialInputTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialInputType[] | ListEnumCredentialInputTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialInputTypeWithAggregatesFilter<$PrismaModel> | $Enums.CredentialInputType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCredentialInputTypeFilter<$PrismaModel>
    _max?: NestedEnumCredentialInputTypeFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EnumVerificationMethodFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationMethod | EnumVerificationMethodFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationMethod[] | ListEnumVerificationMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationMethod[] | ListEnumVerificationMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationMethodFilter<$PrismaModel> | $Enums.VerificationMethod
  }

  export type EnumVerificationLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationLevel | EnumVerificationLevelFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationLevel[] | ListEnumVerificationLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationLevel[] | ListEnumVerificationLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationLevelFilter<$PrismaModel> | $Enums.VerificationLevel
  }

  export type CredentialScalarRelationFilter = {
    is?: CredentialWhereInput
    isNot?: CredentialWhereInput
  }

  export type VerificationCheckListRelationFilter = {
    every?: VerificationCheckWhereInput
    some?: VerificationCheckWhereInput
    none?: VerificationCheckWhereInput
  }

  export type VerificationEvidenceListRelationFilter = {
    every?: VerificationEvidenceWhereInput
    some?: VerificationEvidenceWhereInput
    none?: VerificationEvidenceWhereInput
  }

  export type VerificationAttemptListRelationFilter = {
    every?: VerificationAttemptWhereInput
    some?: VerificationAttemptWhereInput
    none?: VerificationAttemptWhereInput
  }

  export type VerificationCheckOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VerificationEvidenceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VerificationAttemptOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VerificationCountOrderByAggregateInput = {
    id?: SortOrder
    credentialId?: SortOrder
    method?: SortOrder
    provider?: SortOrder
    verificationLevel?: SortOrder
    verifiedAt?: SortOrder
    adapterVersion?: SortOrder
    evidenceUrl?: SortOrder
    rawResponse?: SortOrder
    createdAt?: SortOrder
  }

  export type VerificationMaxOrderByAggregateInput = {
    id?: SortOrder
    credentialId?: SortOrder
    method?: SortOrder
    provider?: SortOrder
    verificationLevel?: SortOrder
    verifiedAt?: SortOrder
    adapterVersion?: SortOrder
    evidenceUrl?: SortOrder
    createdAt?: SortOrder
  }

  export type VerificationMinOrderByAggregateInput = {
    id?: SortOrder
    credentialId?: SortOrder
    method?: SortOrder
    provider?: SortOrder
    verificationLevel?: SortOrder
    verifiedAt?: SortOrder
    adapterVersion?: SortOrder
    evidenceUrl?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumVerificationMethodWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationMethod | EnumVerificationMethodFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationMethod[] | ListEnumVerificationMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationMethod[] | ListEnumVerificationMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationMethodWithAggregatesFilter<$PrismaModel> | $Enums.VerificationMethod
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationMethodFilter<$PrismaModel>
    _max?: NestedEnumVerificationMethodFilter<$PrismaModel>
  }

  export type EnumVerificationLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationLevel | EnumVerificationLevelFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationLevel[] | ListEnumVerificationLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationLevel[] | ListEnumVerificationLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationLevelWithAggregatesFilter<$PrismaModel> | $Enums.VerificationLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationLevelFilter<$PrismaModel>
    _max?: NestedEnumVerificationLevelFilter<$PrismaModel>
  }

  export type EnumCheckResultFilter<$PrismaModel = never> = {
    equals?: $Enums.CheckResult | EnumCheckResultFieldRefInput<$PrismaModel>
    in?: $Enums.CheckResult[] | ListEnumCheckResultFieldRefInput<$PrismaModel>
    notIn?: $Enums.CheckResult[] | ListEnumCheckResultFieldRefInput<$PrismaModel>
    not?: NestedEnumCheckResultFilter<$PrismaModel> | $Enums.CheckResult
  }

  export type VerificationScalarRelationFilter = {
    is?: VerificationWhereInput
    isNot?: VerificationWhereInput
  }

  export type VerificationCheckCountOrderByAggregateInput = {
    id?: SortOrder
    verificationId?: SortOrder
    checkName?: SortOrder
    result?: SortOrder
    detail?: SortOrder
  }

  export type VerificationCheckMaxOrderByAggregateInput = {
    id?: SortOrder
    verificationId?: SortOrder
    checkName?: SortOrder
    result?: SortOrder
    detail?: SortOrder
  }

  export type VerificationCheckMinOrderByAggregateInput = {
    id?: SortOrder
    verificationId?: SortOrder
    checkName?: SortOrder
    result?: SortOrder
    detail?: SortOrder
  }

  export type EnumCheckResultWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CheckResult | EnumCheckResultFieldRefInput<$PrismaModel>
    in?: $Enums.CheckResult[] | ListEnumCheckResultFieldRefInput<$PrismaModel>
    notIn?: $Enums.CheckResult[] | ListEnumCheckResultFieldRefInput<$PrismaModel>
    not?: NestedEnumCheckResultWithAggregatesFilter<$PrismaModel> | $Enums.CheckResult
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCheckResultFilter<$PrismaModel>
    _max?: NestedEnumCheckResultFilter<$PrismaModel>
  }

  export type VerificationEvidenceCountOrderByAggregateInput = {
    id?: SortOrder
    verificationId?: SortOrder
    evidenceType?: SortOrder
    url?: SortOrder
    fileRef?: SortOrder
    metadata?: SortOrder
  }

  export type VerificationEvidenceMaxOrderByAggregateInput = {
    id?: SortOrder
    verificationId?: SortOrder
    evidenceType?: SortOrder
    url?: SortOrder
    fileRef?: SortOrder
  }

  export type VerificationEvidenceMinOrderByAggregateInput = {
    id?: SortOrder
    verificationId?: SortOrder
    evidenceType?: SortOrder
    url?: SortOrder
    fileRef?: SortOrder
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type VerificationAttemptCountOrderByAggregateInput = {
    id?: SortOrder
    verificationId?: SortOrder
    attemptedAt?: SortOrder
    outcome?: SortOrder
    error?: SortOrder
    durationMs?: SortOrder
  }

  export type VerificationAttemptAvgOrderByAggregateInput = {
    durationMs?: SortOrder
  }

  export type VerificationAttemptMaxOrderByAggregateInput = {
    id?: SortOrder
    verificationId?: SortOrder
    attemptedAt?: SortOrder
    outcome?: SortOrder
    error?: SortOrder
    durationMs?: SortOrder
  }

  export type VerificationAttemptMinOrderByAggregateInput = {
    id?: SortOrder
    verificationId?: SortOrder
    attemptedAt?: SortOrder
    outcome?: SortOrder
    error?: SortOrder
    durationMs?: SortOrder
  }

  export type VerificationAttemptSumOrderByAggregateInput = {
    durationMs?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumIntegrationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationType | EnumIntegrationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationType[] | ListEnumIntegrationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationType[] | ListEnumIntegrationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationTypeFilter<$PrismaModel> | $Enums.IntegrationType
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type EnumConfidenceLevelNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.ConfidenceLevel | EnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    in?: $Enums.ConfidenceLevel[] | ListEnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ConfidenceLevel[] | ListEnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    not?: NestedEnumConfidenceLevelNullableFilter<$PrismaModel> | $Enums.ConfidenceLevel | null
  }

  export type IssuerNullableScalarRelationFilter = {
    is?: IssuerWhereInput | null
    isNot?: IssuerWhereInput | null
  }

  export type IssuerAdapterCountOrderByAggregateInput = {
    id?: SortOrder
    issuerId?: SortOrder
    adapterName?: SortOrder
    integrationType?: SortOrder
    capabilities?: SortOrder
    confidence?: SortOrder
    notes?: SortOrder
    updatedAt?: SortOrder
  }

  export type IssuerAdapterMaxOrderByAggregateInput = {
    id?: SortOrder
    issuerId?: SortOrder
    adapterName?: SortOrder
    integrationType?: SortOrder
    confidence?: SortOrder
    notes?: SortOrder
    updatedAt?: SortOrder
  }

  export type IssuerAdapterMinOrderByAggregateInput = {
    id?: SortOrder
    issuerId?: SortOrder
    adapterName?: SortOrder
    integrationType?: SortOrder
    confidence?: SortOrder
    notes?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumIntegrationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationType | EnumIntegrationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationType[] | ListEnumIntegrationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationType[] | ListEnumIntegrationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationTypeWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntegrationTypeFilter<$PrismaModel>
    _max?: NestedEnumIntegrationTypeFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type EnumConfidenceLevelNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ConfidenceLevel | EnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    in?: $Enums.ConfidenceLevel[] | ListEnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ConfidenceLevel[] | ListEnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    not?: NestedEnumConfidenceLevelNullableWithAggregatesFilter<$PrismaModel> | $Enums.ConfidenceLevel | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumConfidenceLevelNullableFilter<$PrismaModel>
    _max?: NestedEnumConfidenceLevelNullableFilter<$PrismaModel>
  }

  export type TrustRegistryEntryCountOrderByAggregateInput = {
    id?: SortOrder
    issuerId?: SortOrder
    platformName?: SortOrder
    trustLevel?: SortOrder
    notes?: SortOrder
    updatedAt?: SortOrder
  }

  export type TrustRegistryEntryMaxOrderByAggregateInput = {
    id?: SortOrder
    issuerId?: SortOrder
    platformName?: SortOrder
    trustLevel?: SortOrder
    notes?: SortOrder
    updatedAt?: SortOrder
  }

  export type TrustRegistryEntryMinOrderByAggregateInput = {
    id?: SortOrder
    issuerId?: SortOrder
    platformName?: SortOrder
    trustLevel?: SortOrder
    notes?: SortOrder
    updatedAt?: SortOrder
  }

  export type CredentialCreateNestedManyWithoutIssuerInput = {
    create?: XOR<CredentialCreateWithoutIssuerInput, CredentialUncheckedCreateWithoutIssuerInput> | CredentialCreateWithoutIssuerInput[] | CredentialUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutIssuerInput | CredentialCreateOrConnectWithoutIssuerInput[]
    createMany?: CredentialCreateManyIssuerInputEnvelope
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
  }

  export type IssuerAdapterCreateNestedManyWithoutIssuerInput = {
    create?: XOR<IssuerAdapterCreateWithoutIssuerInput, IssuerAdapterUncheckedCreateWithoutIssuerInput> | IssuerAdapterCreateWithoutIssuerInput[] | IssuerAdapterUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: IssuerAdapterCreateOrConnectWithoutIssuerInput | IssuerAdapterCreateOrConnectWithoutIssuerInput[]
    createMany?: IssuerAdapterCreateManyIssuerInputEnvelope
    connect?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
  }

  export type TrustRegistryEntryCreateNestedManyWithoutIssuerInput = {
    create?: XOR<TrustRegistryEntryCreateWithoutIssuerInput, TrustRegistryEntryUncheckedCreateWithoutIssuerInput> | TrustRegistryEntryCreateWithoutIssuerInput[] | TrustRegistryEntryUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: TrustRegistryEntryCreateOrConnectWithoutIssuerInput | TrustRegistryEntryCreateOrConnectWithoutIssuerInput[]
    createMany?: TrustRegistryEntryCreateManyIssuerInputEnvelope
    connect?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
  }

  export type CredentialUncheckedCreateNestedManyWithoutIssuerInput = {
    create?: XOR<CredentialCreateWithoutIssuerInput, CredentialUncheckedCreateWithoutIssuerInput> | CredentialCreateWithoutIssuerInput[] | CredentialUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutIssuerInput | CredentialCreateOrConnectWithoutIssuerInput[]
    createMany?: CredentialCreateManyIssuerInputEnvelope
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
  }

  export type IssuerAdapterUncheckedCreateNestedManyWithoutIssuerInput = {
    create?: XOR<IssuerAdapterCreateWithoutIssuerInput, IssuerAdapterUncheckedCreateWithoutIssuerInput> | IssuerAdapterCreateWithoutIssuerInput[] | IssuerAdapterUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: IssuerAdapterCreateOrConnectWithoutIssuerInput | IssuerAdapterCreateOrConnectWithoutIssuerInput[]
    createMany?: IssuerAdapterCreateManyIssuerInputEnvelope
    connect?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
  }

  export type TrustRegistryEntryUncheckedCreateNestedManyWithoutIssuerInput = {
    create?: XOR<TrustRegistryEntryCreateWithoutIssuerInput, TrustRegistryEntryUncheckedCreateWithoutIssuerInput> | TrustRegistryEntryCreateWithoutIssuerInput[] | TrustRegistryEntryUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: TrustRegistryEntryCreateOrConnectWithoutIssuerInput | TrustRegistryEntryCreateOrConnectWithoutIssuerInput[]
    createMany?: TrustRegistryEntryCreateManyIssuerInputEnvelope
    connect?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumIssuerTrustStatusFieldUpdateOperationsInput = {
    set?: $Enums.IssuerTrustStatus
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CredentialUpdateManyWithoutIssuerNestedInput = {
    create?: XOR<CredentialCreateWithoutIssuerInput, CredentialUncheckedCreateWithoutIssuerInput> | CredentialCreateWithoutIssuerInput[] | CredentialUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutIssuerInput | CredentialCreateOrConnectWithoutIssuerInput[]
    upsert?: CredentialUpsertWithWhereUniqueWithoutIssuerInput | CredentialUpsertWithWhereUniqueWithoutIssuerInput[]
    createMany?: CredentialCreateManyIssuerInputEnvelope
    set?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    disconnect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    delete?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    update?: CredentialUpdateWithWhereUniqueWithoutIssuerInput | CredentialUpdateWithWhereUniqueWithoutIssuerInput[]
    updateMany?: CredentialUpdateManyWithWhereWithoutIssuerInput | CredentialUpdateManyWithWhereWithoutIssuerInput[]
    deleteMany?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
  }

  export type IssuerAdapterUpdateManyWithoutIssuerNestedInput = {
    create?: XOR<IssuerAdapterCreateWithoutIssuerInput, IssuerAdapterUncheckedCreateWithoutIssuerInput> | IssuerAdapterCreateWithoutIssuerInput[] | IssuerAdapterUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: IssuerAdapterCreateOrConnectWithoutIssuerInput | IssuerAdapterCreateOrConnectWithoutIssuerInput[]
    upsert?: IssuerAdapterUpsertWithWhereUniqueWithoutIssuerInput | IssuerAdapterUpsertWithWhereUniqueWithoutIssuerInput[]
    createMany?: IssuerAdapterCreateManyIssuerInputEnvelope
    set?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
    disconnect?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
    delete?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
    connect?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
    update?: IssuerAdapterUpdateWithWhereUniqueWithoutIssuerInput | IssuerAdapterUpdateWithWhereUniqueWithoutIssuerInput[]
    updateMany?: IssuerAdapterUpdateManyWithWhereWithoutIssuerInput | IssuerAdapterUpdateManyWithWhereWithoutIssuerInput[]
    deleteMany?: IssuerAdapterScalarWhereInput | IssuerAdapterScalarWhereInput[]
  }

  export type TrustRegistryEntryUpdateManyWithoutIssuerNestedInput = {
    create?: XOR<TrustRegistryEntryCreateWithoutIssuerInput, TrustRegistryEntryUncheckedCreateWithoutIssuerInput> | TrustRegistryEntryCreateWithoutIssuerInput[] | TrustRegistryEntryUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: TrustRegistryEntryCreateOrConnectWithoutIssuerInput | TrustRegistryEntryCreateOrConnectWithoutIssuerInput[]
    upsert?: TrustRegistryEntryUpsertWithWhereUniqueWithoutIssuerInput | TrustRegistryEntryUpsertWithWhereUniqueWithoutIssuerInput[]
    createMany?: TrustRegistryEntryCreateManyIssuerInputEnvelope
    set?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
    disconnect?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
    delete?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
    connect?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
    update?: TrustRegistryEntryUpdateWithWhereUniqueWithoutIssuerInput | TrustRegistryEntryUpdateWithWhereUniqueWithoutIssuerInput[]
    updateMany?: TrustRegistryEntryUpdateManyWithWhereWithoutIssuerInput | TrustRegistryEntryUpdateManyWithWhereWithoutIssuerInput[]
    deleteMany?: TrustRegistryEntryScalarWhereInput | TrustRegistryEntryScalarWhereInput[]
  }

  export type CredentialUncheckedUpdateManyWithoutIssuerNestedInput = {
    create?: XOR<CredentialCreateWithoutIssuerInput, CredentialUncheckedCreateWithoutIssuerInput> | CredentialCreateWithoutIssuerInput[] | CredentialUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutIssuerInput | CredentialCreateOrConnectWithoutIssuerInput[]
    upsert?: CredentialUpsertWithWhereUniqueWithoutIssuerInput | CredentialUpsertWithWhereUniqueWithoutIssuerInput[]
    createMany?: CredentialCreateManyIssuerInputEnvelope
    set?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    disconnect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    delete?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    update?: CredentialUpdateWithWhereUniqueWithoutIssuerInput | CredentialUpdateWithWhereUniqueWithoutIssuerInput[]
    updateMany?: CredentialUpdateManyWithWhereWithoutIssuerInput | CredentialUpdateManyWithWhereWithoutIssuerInput[]
    deleteMany?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
  }

  export type IssuerAdapterUncheckedUpdateManyWithoutIssuerNestedInput = {
    create?: XOR<IssuerAdapterCreateWithoutIssuerInput, IssuerAdapterUncheckedCreateWithoutIssuerInput> | IssuerAdapterCreateWithoutIssuerInput[] | IssuerAdapterUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: IssuerAdapterCreateOrConnectWithoutIssuerInput | IssuerAdapterCreateOrConnectWithoutIssuerInput[]
    upsert?: IssuerAdapterUpsertWithWhereUniqueWithoutIssuerInput | IssuerAdapterUpsertWithWhereUniqueWithoutIssuerInput[]
    createMany?: IssuerAdapterCreateManyIssuerInputEnvelope
    set?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
    disconnect?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
    delete?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
    connect?: IssuerAdapterWhereUniqueInput | IssuerAdapterWhereUniqueInput[]
    update?: IssuerAdapterUpdateWithWhereUniqueWithoutIssuerInput | IssuerAdapterUpdateWithWhereUniqueWithoutIssuerInput[]
    updateMany?: IssuerAdapterUpdateManyWithWhereWithoutIssuerInput | IssuerAdapterUpdateManyWithWhereWithoutIssuerInput[]
    deleteMany?: IssuerAdapterScalarWhereInput | IssuerAdapterScalarWhereInput[]
  }

  export type TrustRegistryEntryUncheckedUpdateManyWithoutIssuerNestedInput = {
    create?: XOR<TrustRegistryEntryCreateWithoutIssuerInput, TrustRegistryEntryUncheckedCreateWithoutIssuerInput> | TrustRegistryEntryCreateWithoutIssuerInput[] | TrustRegistryEntryUncheckedCreateWithoutIssuerInput[]
    connectOrCreate?: TrustRegistryEntryCreateOrConnectWithoutIssuerInput | TrustRegistryEntryCreateOrConnectWithoutIssuerInput[]
    upsert?: TrustRegistryEntryUpsertWithWhereUniqueWithoutIssuerInput | TrustRegistryEntryUpsertWithWhereUniqueWithoutIssuerInput[]
    createMany?: TrustRegistryEntryCreateManyIssuerInputEnvelope
    set?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
    disconnect?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
    delete?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
    connect?: TrustRegistryEntryWhereUniqueInput | TrustRegistryEntryWhereUniqueInput[]
    update?: TrustRegistryEntryUpdateWithWhereUniqueWithoutIssuerInput | TrustRegistryEntryUpdateWithWhereUniqueWithoutIssuerInput[]
    updateMany?: TrustRegistryEntryUpdateManyWithWhereWithoutIssuerInput | TrustRegistryEntryUpdateManyWithWhereWithoutIssuerInput[]
    deleteMany?: TrustRegistryEntryScalarWhereInput | TrustRegistryEntryScalarWhereInput[]
  }

  export type CredentialCreateNestedManyWithoutSubjectInput = {
    create?: XOR<CredentialCreateWithoutSubjectInput, CredentialUncheckedCreateWithoutSubjectInput> | CredentialCreateWithoutSubjectInput[] | CredentialUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutSubjectInput | CredentialCreateOrConnectWithoutSubjectInput[]
    createMany?: CredentialCreateManySubjectInputEnvelope
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
  }

  export type CredentialUncheckedCreateNestedManyWithoutSubjectInput = {
    create?: XOR<CredentialCreateWithoutSubjectInput, CredentialUncheckedCreateWithoutSubjectInput> | CredentialCreateWithoutSubjectInput[] | CredentialUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutSubjectInput | CredentialCreateOrConnectWithoutSubjectInput[]
    createMany?: CredentialCreateManySubjectInputEnvelope
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
  }

  export type CredentialUpdateManyWithoutSubjectNestedInput = {
    create?: XOR<CredentialCreateWithoutSubjectInput, CredentialUncheckedCreateWithoutSubjectInput> | CredentialCreateWithoutSubjectInput[] | CredentialUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutSubjectInput | CredentialCreateOrConnectWithoutSubjectInput[]
    upsert?: CredentialUpsertWithWhereUniqueWithoutSubjectInput | CredentialUpsertWithWhereUniqueWithoutSubjectInput[]
    createMany?: CredentialCreateManySubjectInputEnvelope
    set?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    disconnect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    delete?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    update?: CredentialUpdateWithWhereUniqueWithoutSubjectInput | CredentialUpdateWithWhereUniqueWithoutSubjectInput[]
    updateMany?: CredentialUpdateManyWithWhereWithoutSubjectInput | CredentialUpdateManyWithWhereWithoutSubjectInput[]
    deleteMany?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
  }

  export type CredentialUncheckedUpdateManyWithoutSubjectNestedInput = {
    create?: XOR<CredentialCreateWithoutSubjectInput, CredentialUncheckedCreateWithoutSubjectInput> | CredentialCreateWithoutSubjectInput[] | CredentialUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutSubjectInput | CredentialCreateOrConnectWithoutSubjectInput[]
    upsert?: CredentialUpsertWithWhereUniqueWithoutSubjectInput | CredentialUpsertWithWhereUniqueWithoutSubjectInput[]
    createMany?: CredentialCreateManySubjectInputEnvelope
    set?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    disconnect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    delete?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    update?: CredentialUpdateWithWhereUniqueWithoutSubjectInput | CredentialUpdateWithWhereUniqueWithoutSubjectInput[]
    updateMany?: CredentialUpdateManyWithWhereWithoutSubjectInput | CredentialUpdateManyWithWhereWithoutSubjectInput[]
    deleteMany?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
  }

  export type AchievementCreateskillsInput = {
    set: string[]
  }

  export type CredentialCreateNestedManyWithoutAchievementInput = {
    create?: XOR<CredentialCreateWithoutAchievementInput, CredentialUncheckedCreateWithoutAchievementInput> | CredentialCreateWithoutAchievementInput[] | CredentialUncheckedCreateWithoutAchievementInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutAchievementInput | CredentialCreateOrConnectWithoutAchievementInput[]
    createMany?: CredentialCreateManyAchievementInputEnvelope
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
  }

  export type CredentialUncheckedCreateNestedManyWithoutAchievementInput = {
    create?: XOR<CredentialCreateWithoutAchievementInput, CredentialUncheckedCreateWithoutAchievementInput> | CredentialCreateWithoutAchievementInput[] | CredentialUncheckedCreateWithoutAchievementInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutAchievementInput | CredentialCreateOrConnectWithoutAchievementInput[]
    createMany?: CredentialCreateManyAchievementInputEnvelope
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
  }

  export type EnumCredentialTypeFieldUpdateOperationsInput = {
    set?: $Enums.CredentialType
  }

  export type AchievementUpdateskillsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type CredentialUpdateManyWithoutAchievementNestedInput = {
    create?: XOR<CredentialCreateWithoutAchievementInput, CredentialUncheckedCreateWithoutAchievementInput> | CredentialCreateWithoutAchievementInput[] | CredentialUncheckedCreateWithoutAchievementInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutAchievementInput | CredentialCreateOrConnectWithoutAchievementInput[]
    upsert?: CredentialUpsertWithWhereUniqueWithoutAchievementInput | CredentialUpsertWithWhereUniqueWithoutAchievementInput[]
    createMany?: CredentialCreateManyAchievementInputEnvelope
    set?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    disconnect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    delete?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    update?: CredentialUpdateWithWhereUniqueWithoutAchievementInput | CredentialUpdateWithWhereUniqueWithoutAchievementInput[]
    updateMany?: CredentialUpdateManyWithWhereWithoutAchievementInput | CredentialUpdateManyWithWhereWithoutAchievementInput[]
    deleteMany?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
  }

  export type CredentialUncheckedUpdateManyWithoutAchievementNestedInput = {
    create?: XOR<CredentialCreateWithoutAchievementInput, CredentialUncheckedCreateWithoutAchievementInput> | CredentialCreateWithoutAchievementInput[] | CredentialUncheckedCreateWithoutAchievementInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutAchievementInput | CredentialCreateOrConnectWithoutAchievementInput[]
    upsert?: CredentialUpsertWithWhereUniqueWithoutAchievementInput | CredentialUpsertWithWhereUniqueWithoutAchievementInput[]
    createMany?: CredentialCreateManyAchievementInputEnvelope
    set?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    disconnect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    delete?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    update?: CredentialUpdateWithWhereUniqueWithoutAchievementInput | CredentialUpdateWithWhereUniqueWithoutAchievementInput[]
    updateMany?: CredentialUpdateManyWithWhereWithoutAchievementInput | CredentialUpdateManyWithWhereWithoutAchievementInput[]
    deleteMany?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
  }

  export type IssuerCreateNestedOneWithoutCredentialsInput = {
    create?: XOR<IssuerCreateWithoutCredentialsInput, IssuerUncheckedCreateWithoutCredentialsInput>
    connectOrCreate?: IssuerCreateOrConnectWithoutCredentialsInput
    connect?: IssuerWhereUniqueInput
  }

  export type SubjectCreateNestedOneWithoutCredentialsInput = {
    create?: XOR<SubjectCreateWithoutCredentialsInput, SubjectUncheckedCreateWithoutCredentialsInput>
    connectOrCreate?: SubjectCreateOrConnectWithoutCredentialsInput
    connect?: SubjectWhereUniqueInput
  }

  export type AchievementCreateNestedOneWithoutCredentialsInput = {
    create?: XOR<AchievementCreateWithoutCredentialsInput, AchievementUncheckedCreateWithoutCredentialsInput>
    connectOrCreate?: AchievementCreateOrConnectWithoutCredentialsInput
    connect?: AchievementWhereUniqueInput
  }

  export type VerificationCreateNestedManyWithoutCredentialInput = {
    create?: XOR<VerificationCreateWithoutCredentialInput, VerificationUncheckedCreateWithoutCredentialInput> | VerificationCreateWithoutCredentialInput[] | VerificationUncheckedCreateWithoutCredentialInput[]
    connectOrCreate?: VerificationCreateOrConnectWithoutCredentialInput | VerificationCreateOrConnectWithoutCredentialInput[]
    createMany?: VerificationCreateManyCredentialInputEnvelope
    connect?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
  }

  export type VerificationUncheckedCreateNestedManyWithoutCredentialInput = {
    create?: XOR<VerificationCreateWithoutCredentialInput, VerificationUncheckedCreateWithoutCredentialInput> | VerificationCreateWithoutCredentialInput[] | VerificationUncheckedCreateWithoutCredentialInput[]
    connectOrCreate?: VerificationCreateOrConnectWithoutCredentialInput | VerificationCreateOrConnectWithoutCredentialInput[]
    createMany?: VerificationCreateManyCredentialInputEnvelope
    connect?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type EnumVerificationStatusFieldUpdateOperationsInput = {
    set?: $Enums.VerificationStatus
  }

  export type EnumCredentialInputTypeFieldUpdateOperationsInput = {
    set?: $Enums.CredentialInputType
  }

  export type IssuerUpdateOneRequiredWithoutCredentialsNestedInput = {
    create?: XOR<IssuerCreateWithoutCredentialsInput, IssuerUncheckedCreateWithoutCredentialsInput>
    connectOrCreate?: IssuerCreateOrConnectWithoutCredentialsInput
    upsert?: IssuerUpsertWithoutCredentialsInput
    connect?: IssuerWhereUniqueInput
    update?: XOR<XOR<IssuerUpdateToOneWithWhereWithoutCredentialsInput, IssuerUpdateWithoutCredentialsInput>, IssuerUncheckedUpdateWithoutCredentialsInput>
  }

  export type SubjectUpdateOneRequiredWithoutCredentialsNestedInput = {
    create?: XOR<SubjectCreateWithoutCredentialsInput, SubjectUncheckedCreateWithoutCredentialsInput>
    connectOrCreate?: SubjectCreateOrConnectWithoutCredentialsInput
    upsert?: SubjectUpsertWithoutCredentialsInput
    connect?: SubjectWhereUniqueInput
    update?: XOR<XOR<SubjectUpdateToOneWithWhereWithoutCredentialsInput, SubjectUpdateWithoutCredentialsInput>, SubjectUncheckedUpdateWithoutCredentialsInput>
  }

  export type AchievementUpdateOneRequiredWithoutCredentialsNestedInput = {
    create?: XOR<AchievementCreateWithoutCredentialsInput, AchievementUncheckedCreateWithoutCredentialsInput>
    connectOrCreate?: AchievementCreateOrConnectWithoutCredentialsInput
    upsert?: AchievementUpsertWithoutCredentialsInput
    connect?: AchievementWhereUniqueInput
    update?: XOR<XOR<AchievementUpdateToOneWithWhereWithoutCredentialsInput, AchievementUpdateWithoutCredentialsInput>, AchievementUncheckedUpdateWithoutCredentialsInput>
  }

  export type VerificationUpdateManyWithoutCredentialNestedInput = {
    create?: XOR<VerificationCreateWithoutCredentialInput, VerificationUncheckedCreateWithoutCredentialInput> | VerificationCreateWithoutCredentialInput[] | VerificationUncheckedCreateWithoutCredentialInput[]
    connectOrCreate?: VerificationCreateOrConnectWithoutCredentialInput | VerificationCreateOrConnectWithoutCredentialInput[]
    upsert?: VerificationUpsertWithWhereUniqueWithoutCredentialInput | VerificationUpsertWithWhereUniqueWithoutCredentialInput[]
    createMany?: VerificationCreateManyCredentialInputEnvelope
    set?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
    disconnect?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
    delete?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
    connect?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
    update?: VerificationUpdateWithWhereUniqueWithoutCredentialInput | VerificationUpdateWithWhereUniqueWithoutCredentialInput[]
    updateMany?: VerificationUpdateManyWithWhereWithoutCredentialInput | VerificationUpdateManyWithWhereWithoutCredentialInput[]
    deleteMany?: VerificationScalarWhereInput | VerificationScalarWhereInput[]
  }

  export type VerificationUncheckedUpdateManyWithoutCredentialNestedInput = {
    create?: XOR<VerificationCreateWithoutCredentialInput, VerificationUncheckedCreateWithoutCredentialInput> | VerificationCreateWithoutCredentialInput[] | VerificationUncheckedCreateWithoutCredentialInput[]
    connectOrCreate?: VerificationCreateOrConnectWithoutCredentialInput | VerificationCreateOrConnectWithoutCredentialInput[]
    upsert?: VerificationUpsertWithWhereUniqueWithoutCredentialInput | VerificationUpsertWithWhereUniqueWithoutCredentialInput[]
    createMany?: VerificationCreateManyCredentialInputEnvelope
    set?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
    disconnect?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
    delete?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
    connect?: VerificationWhereUniqueInput | VerificationWhereUniqueInput[]
    update?: VerificationUpdateWithWhereUniqueWithoutCredentialInput | VerificationUpdateWithWhereUniqueWithoutCredentialInput[]
    updateMany?: VerificationUpdateManyWithWhereWithoutCredentialInput | VerificationUpdateManyWithWhereWithoutCredentialInput[]
    deleteMany?: VerificationScalarWhereInput | VerificationScalarWhereInput[]
  }

  export type CredentialCreateNestedOneWithoutVerificationsInput = {
    create?: XOR<CredentialCreateWithoutVerificationsInput, CredentialUncheckedCreateWithoutVerificationsInput>
    connectOrCreate?: CredentialCreateOrConnectWithoutVerificationsInput
    connect?: CredentialWhereUniqueInput
  }

  export type VerificationCheckCreateNestedManyWithoutVerificationInput = {
    create?: XOR<VerificationCheckCreateWithoutVerificationInput, VerificationCheckUncheckedCreateWithoutVerificationInput> | VerificationCheckCreateWithoutVerificationInput[] | VerificationCheckUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationCheckCreateOrConnectWithoutVerificationInput | VerificationCheckCreateOrConnectWithoutVerificationInput[]
    createMany?: VerificationCheckCreateManyVerificationInputEnvelope
    connect?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
  }

  export type VerificationEvidenceCreateNestedManyWithoutVerificationInput = {
    create?: XOR<VerificationEvidenceCreateWithoutVerificationInput, VerificationEvidenceUncheckedCreateWithoutVerificationInput> | VerificationEvidenceCreateWithoutVerificationInput[] | VerificationEvidenceUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationEvidenceCreateOrConnectWithoutVerificationInput | VerificationEvidenceCreateOrConnectWithoutVerificationInput[]
    createMany?: VerificationEvidenceCreateManyVerificationInputEnvelope
    connect?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
  }

  export type VerificationAttemptCreateNestedManyWithoutVerificationInput = {
    create?: XOR<VerificationAttemptCreateWithoutVerificationInput, VerificationAttemptUncheckedCreateWithoutVerificationInput> | VerificationAttemptCreateWithoutVerificationInput[] | VerificationAttemptUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationAttemptCreateOrConnectWithoutVerificationInput | VerificationAttemptCreateOrConnectWithoutVerificationInput[]
    createMany?: VerificationAttemptCreateManyVerificationInputEnvelope
    connect?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
  }

  export type VerificationCheckUncheckedCreateNestedManyWithoutVerificationInput = {
    create?: XOR<VerificationCheckCreateWithoutVerificationInput, VerificationCheckUncheckedCreateWithoutVerificationInput> | VerificationCheckCreateWithoutVerificationInput[] | VerificationCheckUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationCheckCreateOrConnectWithoutVerificationInput | VerificationCheckCreateOrConnectWithoutVerificationInput[]
    createMany?: VerificationCheckCreateManyVerificationInputEnvelope
    connect?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
  }

  export type VerificationEvidenceUncheckedCreateNestedManyWithoutVerificationInput = {
    create?: XOR<VerificationEvidenceCreateWithoutVerificationInput, VerificationEvidenceUncheckedCreateWithoutVerificationInput> | VerificationEvidenceCreateWithoutVerificationInput[] | VerificationEvidenceUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationEvidenceCreateOrConnectWithoutVerificationInput | VerificationEvidenceCreateOrConnectWithoutVerificationInput[]
    createMany?: VerificationEvidenceCreateManyVerificationInputEnvelope
    connect?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
  }

  export type VerificationAttemptUncheckedCreateNestedManyWithoutVerificationInput = {
    create?: XOR<VerificationAttemptCreateWithoutVerificationInput, VerificationAttemptUncheckedCreateWithoutVerificationInput> | VerificationAttemptCreateWithoutVerificationInput[] | VerificationAttemptUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationAttemptCreateOrConnectWithoutVerificationInput | VerificationAttemptCreateOrConnectWithoutVerificationInput[]
    createMany?: VerificationAttemptCreateManyVerificationInputEnvelope
    connect?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
  }

  export type EnumVerificationMethodFieldUpdateOperationsInput = {
    set?: $Enums.VerificationMethod
  }

  export type EnumVerificationLevelFieldUpdateOperationsInput = {
    set?: $Enums.VerificationLevel
  }

  export type CredentialUpdateOneRequiredWithoutVerificationsNestedInput = {
    create?: XOR<CredentialCreateWithoutVerificationsInput, CredentialUncheckedCreateWithoutVerificationsInput>
    connectOrCreate?: CredentialCreateOrConnectWithoutVerificationsInput
    upsert?: CredentialUpsertWithoutVerificationsInput
    connect?: CredentialWhereUniqueInput
    update?: XOR<XOR<CredentialUpdateToOneWithWhereWithoutVerificationsInput, CredentialUpdateWithoutVerificationsInput>, CredentialUncheckedUpdateWithoutVerificationsInput>
  }

  export type VerificationCheckUpdateManyWithoutVerificationNestedInput = {
    create?: XOR<VerificationCheckCreateWithoutVerificationInput, VerificationCheckUncheckedCreateWithoutVerificationInput> | VerificationCheckCreateWithoutVerificationInput[] | VerificationCheckUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationCheckCreateOrConnectWithoutVerificationInput | VerificationCheckCreateOrConnectWithoutVerificationInput[]
    upsert?: VerificationCheckUpsertWithWhereUniqueWithoutVerificationInput | VerificationCheckUpsertWithWhereUniqueWithoutVerificationInput[]
    createMany?: VerificationCheckCreateManyVerificationInputEnvelope
    set?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
    disconnect?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
    delete?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
    connect?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
    update?: VerificationCheckUpdateWithWhereUniqueWithoutVerificationInput | VerificationCheckUpdateWithWhereUniqueWithoutVerificationInput[]
    updateMany?: VerificationCheckUpdateManyWithWhereWithoutVerificationInput | VerificationCheckUpdateManyWithWhereWithoutVerificationInput[]
    deleteMany?: VerificationCheckScalarWhereInput | VerificationCheckScalarWhereInput[]
  }

  export type VerificationEvidenceUpdateManyWithoutVerificationNestedInput = {
    create?: XOR<VerificationEvidenceCreateWithoutVerificationInput, VerificationEvidenceUncheckedCreateWithoutVerificationInput> | VerificationEvidenceCreateWithoutVerificationInput[] | VerificationEvidenceUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationEvidenceCreateOrConnectWithoutVerificationInput | VerificationEvidenceCreateOrConnectWithoutVerificationInput[]
    upsert?: VerificationEvidenceUpsertWithWhereUniqueWithoutVerificationInput | VerificationEvidenceUpsertWithWhereUniqueWithoutVerificationInput[]
    createMany?: VerificationEvidenceCreateManyVerificationInputEnvelope
    set?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
    disconnect?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
    delete?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
    connect?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
    update?: VerificationEvidenceUpdateWithWhereUniqueWithoutVerificationInput | VerificationEvidenceUpdateWithWhereUniqueWithoutVerificationInput[]
    updateMany?: VerificationEvidenceUpdateManyWithWhereWithoutVerificationInput | VerificationEvidenceUpdateManyWithWhereWithoutVerificationInput[]
    deleteMany?: VerificationEvidenceScalarWhereInput | VerificationEvidenceScalarWhereInput[]
  }

  export type VerificationAttemptUpdateManyWithoutVerificationNestedInput = {
    create?: XOR<VerificationAttemptCreateWithoutVerificationInput, VerificationAttemptUncheckedCreateWithoutVerificationInput> | VerificationAttemptCreateWithoutVerificationInput[] | VerificationAttemptUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationAttemptCreateOrConnectWithoutVerificationInput | VerificationAttemptCreateOrConnectWithoutVerificationInput[]
    upsert?: VerificationAttemptUpsertWithWhereUniqueWithoutVerificationInput | VerificationAttemptUpsertWithWhereUniqueWithoutVerificationInput[]
    createMany?: VerificationAttemptCreateManyVerificationInputEnvelope
    set?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
    disconnect?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
    delete?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
    connect?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
    update?: VerificationAttemptUpdateWithWhereUniqueWithoutVerificationInput | VerificationAttemptUpdateWithWhereUniqueWithoutVerificationInput[]
    updateMany?: VerificationAttemptUpdateManyWithWhereWithoutVerificationInput | VerificationAttemptUpdateManyWithWhereWithoutVerificationInput[]
    deleteMany?: VerificationAttemptScalarWhereInput | VerificationAttemptScalarWhereInput[]
  }

  export type VerificationCheckUncheckedUpdateManyWithoutVerificationNestedInput = {
    create?: XOR<VerificationCheckCreateWithoutVerificationInput, VerificationCheckUncheckedCreateWithoutVerificationInput> | VerificationCheckCreateWithoutVerificationInput[] | VerificationCheckUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationCheckCreateOrConnectWithoutVerificationInput | VerificationCheckCreateOrConnectWithoutVerificationInput[]
    upsert?: VerificationCheckUpsertWithWhereUniqueWithoutVerificationInput | VerificationCheckUpsertWithWhereUniqueWithoutVerificationInput[]
    createMany?: VerificationCheckCreateManyVerificationInputEnvelope
    set?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
    disconnect?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
    delete?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
    connect?: VerificationCheckWhereUniqueInput | VerificationCheckWhereUniqueInput[]
    update?: VerificationCheckUpdateWithWhereUniqueWithoutVerificationInput | VerificationCheckUpdateWithWhereUniqueWithoutVerificationInput[]
    updateMany?: VerificationCheckUpdateManyWithWhereWithoutVerificationInput | VerificationCheckUpdateManyWithWhereWithoutVerificationInput[]
    deleteMany?: VerificationCheckScalarWhereInput | VerificationCheckScalarWhereInput[]
  }

  export type VerificationEvidenceUncheckedUpdateManyWithoutVerificationNestedInput = {
    create?: XOR<VerificationEvidenceCreateWithoutVerificationInput, VerificationEvidenceUncheckedCreateWithoutVerificationInput> | VerificationEvidenceCreateWithoutVerificationInput[] | VerificationEvidenceUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationEvidenceCreateOrConnectWithoutVerificationInput | VerificationEvidenceCreateOrConnectWithoutVerificationInput[]
    upsert?: VerificationEvidenceUpsertWithWhereUniqueWithoutVerificationInput | VerificationEvidenceUpsertWithWhereUniqueWithoutVerificationInput[]
    createMany?: VerificationEvidenceCreateManyVerificationInputEnvelope
    set?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
    disconnect?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
    delete?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
    connect?: VerificationEvidenceWhereUniqueInput | VerificationEvidenceWhereUniqueInput[]
    update?: VerificationEvidenceUpdateWithWhereUniqueWithoutVerificationInput | VerificationEvidenceUpdateWithWhereUniqueWithoutVerificationInput[]
    updateMany?: VerificationEvidenceUpdateManyWithWhereWithoutVerificationInput | VerificationEvidenceUpdateManyWithWhereWithoutVerificationInput[]
    deleteMany?: VerificationEvidenceScalarWhereInput | VerificationEvidenceScalarWhereInput[]
  }

  export type VerificationAttemptUncheckedUpdateManyWithoutVerificationNestedInput = {
    create?: XOR<VerificationAttemptCreateWithoutVerificationInput, VerificationAttemptUncheckedCreateWithoutVerificationInput> | VerificationAttemptCreateWithoutVerificationInput[] | VerificationAttemptUncheckedCreateWithoutVerificationInput[]
    connectOrCreate?: VerificationAttemptCreateOrConnectWithoutVerificationInput | VerificationAttemptCreateOrConnectWithoutVerificationInput[]
    upsert?: VerificationAttemptUpsertWithWhereUniqueWithoutVerificationInput | VerificationAttemptUpsertWithWhereUniqueWithoutVerificationInput[]
    createMany?: VerificationAttemptCreateManyVerificationInputEnvelope
    set?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
    disconnect?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
    delete?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
    connect?: VerificationAttemptWhereUniqueInput | VerificationAttemptWhereUniqueInput[]
    update?: VerificationAttemptUpdateWithWhereUniqueWithoutVerificationInput | VerificationAttemptUpdateWithWhereUniqueWithoutVerificationInput[]
    updateMany?: VerificationAttemptUpdateManyWithWhereWithoutVerificationInput | VerificationAttemptUpdateManyWithWhereWithoutVerificationInput[]
    deleteMany?: VerificationAttemptScalarWhereInput | VerificationAttemptScalarWhereInput[]
  }

  export type VerificationCreateNestedOneWithoutChecksInput = {
    create?: XOR<VerificationCreateWithoutChecksInput, VerificationUncheckedCreateWithoutChecksInput>
    connectOrCreate?: VerificationCreateOrConnectWithoutChecksInput
    connect?: VerificationWhereUniqueInput
  }

  export type EnumCheckResultFieldUpdateOperationsInput = {
    set?: $Enums.CheckResult
  }

  export type VerificationUpdateOneRequiredWithoutChecksNestedInput = {
    create?: XOR<VerificationCreateWithoutChecksInput, VerificationUncheckedCreateWithoutChecksInput>
    connectOrCreate?: VerificationCreateOrConnectWithoutChecksInput
    upsert?: VerificationUpsertWithoutChecksInput
    connect?: VerificationWhereUniqueInput
    update?: XOR<XOR<VerificationUpdateToOneWithWhereWithoutChecksInput, VerificationUpdateWithoutChecksInput>, VerificationUncheckedUpdateWithoutChecksInput>
  }

  export type VerificationCreateNestedOneWithoutEvidenceInput = {
    create?: XOR<VerificationCreateWithoutEvidenceInput, VerificationUncheckedCreateWithoutEvidenceInput>
    connectOrCreate?: VerificationCreateOrConnectWithoutEvidenceInput
    connect?: VerificationWhereUniqueInput
  }

  export type VerificationUpdateOneRequiredWithoutEvidenceNestedInput = {
    create?: XOR<VerificationCreateWithoutEvidenceInput, VerificationUncheckedCreateWithoutEvidenceInput>
    connectOrCreate?: VerificationCreateOrConnectWithoutEvidenceInput
    upsert?: VerificationUpsertWithoutEvidenceInput
    connect?: VerificationWhereUniqueInput
    update?: XOR<XOR<VerificationUpdateToOneWithWhereWithoutEvidenceInput, VerificationUpdateWithoutEvidenceInput>, VerificationUncheckedUpdateWithoutEvidenceInput>
  }

  export type VerificationCreateNestedOneWithoutAttemptsInput = {
    create?: XOR<VerificationCreateWithoutAttemptsInput, VerificationUncheckedCreateWithoutAttemptsInput>
    connectOrCreate?: VerificationCreateOrConnectWithoutAttemptsInput
    connect?: VerificationWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type VerificationUpdateOneRequiredWithoutAttemptsNestedInput = {
    create?: XOR<VerificationCreateWithoutAttemptsInput, VerificationUncheckedCreateWithoutAttemptsInput>
    connectOrCreate?: VerificationCreateOrConnectWithoutAttemptsInput
    upsert?: VerificationUpsertWithoutAttemptsInput
    connect?: VerificationWhereUniqueInput
    update?: XOR<XOR<VerificationUpdateToOneWithWhereWithoutAttemptsInput, VerificationUpdateWithoutAttemptsInput>, VerificationUncheckedUpdateWithoutAttemptsInput>
  }

  export type IssuerCreateNestedOneWithoutAdaptersInput = {
    create?: XOR<IssuerCreateWithoutAdaptersInput, IssuerUncheckedCreateWithoutAdaptersInput>
    connectOrCreate?: IssuerCreateOrConnectWithoutAdaptersInput
    connect?: IssuerWhereUniqueInput
  }

  export type EnumIntegrationTypeFieldUpdateOperationsInput = {
    set?: $Enums.IntegrationType
  }

  export type NullableEnumConfidenceLevelFieldUpdateOperationsInput = {
    set?: $Enums.ConfidenceLevel | null
  }

  export type IssuerUpdateOneWithoutAdaptersNestedInput = {
    create?: XOR<IssuerCreateWithoutAdaptersInput, IssuerUncheckedCreateWithoutAdaptersInput>
    connectOrCreate?: IssuerCreateOrConnectWithoutAdaptersInput
    upsert?: IssuerUpsertWithoutAdaptersInput
    disconnect?: IssuerWhereInput | boolean
    delete?: IssuerWhereInput | boolean
    connect?: IssuerWhereUniqueInput
    update?: XOR<XOR<IssuerUpdateToOneWithWhereWithoutAdaptersInput, IssuerUpdateWithoutAdaptersInput>, IssuerUncheckedUpdateWithoutAdaptersInput>
  }

  export type IssuerCreateNestedOneWithoutTrustRegistryInput = {
    create?: XOR<IssuerCreateWithoutTrustRegistryInput, IssuerUncheckedCreateWithoutTrustRegistryInput>
    connectOrCreate?: IssuerCreateOrConnectWithoutTrustRegistryInput
    connect?: IssuerWhereUniqueInput
  }

  export type IssuerUpdateOneWithoutTrustRegistryNestedInput = {
    create?: XOR<IssuerCreateWithoutTrustRegistryInput, IssuerUncheckedCreateWithoutTrustRegistryInput>
    connectOrCreate?: IssuerCreateOrConnectWithoutTrustRegistryInput
    upsert?: IssuerUpsertWithoutTrustRegistryInput
    disconnect?: IssuerWhereInput | boolean
    delete?: IssuerWhereInput | boolean
    connect?: IssuerWhereUniqueInput
    update?: XOR<XOR<IssuerUpdateToOneWithWhereWithoutTrustRegistryInput, IssuerUpdateWithoutTrustRegistryInput>, IssuerUncheckedUpdateWithoutTrustRegistryInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumIssuerTrustStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.IssuerTrustStatus | EnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IssuerTrustStatus[] | ListEnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IssuerTrustStatus[] | ListEnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIssuerTrustStatusFilter<$PrismaModel> | $Enums.IssuerTrustStatus
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumIssuerTrustStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IssuerTrustStatus | EnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IssuerTrustStatus[] | ListEnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IssuerTrustStatus[] | ListEnumIssuerTrustStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIssuerTrustStatusWithAggregatesFilter<$PrismaModel> | $Enums.IssuerTrustStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIssuerTrustStatusFilter<$PrismaModel>
    _max?: NestedEnumIssuerTrustStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumCredentialTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialType | EnumCredentialTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialTypeFilter<$PrismaModel> | $Enums.CredentialType
  }

  export type NestedEnumCredentialTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialType | EnumCredentialTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialTypeWithAggregatesFilter<$PrismaModel> | $Enums.CredentialType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCredentialTypeFilter<$PrismaModel>
    _max?: NestedEnumCredentialTypeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus
  }

  export type NestedEnumCredentialInputTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialInputType | EnumCredentialInputTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialInputType[] | ListEnumCredentialInputTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialInputType[] | ListEnumCredentialInputTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialInputTypeFilter<$PrismaModel> | $Enums.CredentialInputType
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationStatusFilter<$PrismaModel>
    _max?: NestedEnumVerificationStatusFilter<$PrismaModel>
  }

  export type NestedEnumCredentialInputTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialInputType | EnumCredentialInputTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialInputType[] | ListEnumCredentialInputTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialInputType[] | ListEnumCredentialInputTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialInputTypeWithAggregatesFilter<$PrismaModel> | $Enums.CredentialInputType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCredentialInputTypeFilter<$PrismaModel>
    _max?: NestedEnumCredentialInputTypeFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumVerificationMethodFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationMethod | EnumVerificationMethodFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationMethod[] | ListEnumVerificationMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationMethod[] | ListEnumVerificationMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationMethodFilter<$PrismaModel> | $Enums.VerificationMethod
  }

  export type NestedEnumVerificationLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationLevel | EnumVerificationLevelFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationLevel[] | ListEnumVerificationLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationLevel[] | ListEnumVerificationLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationLevelFilter<$PrismaModel> | $Enums.VerificationLevel
  }

  export type NestedEnumVerificationMethodWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationMethod | EnumVerificationMethodFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationMethod[] | ListEnumVerificationMethodFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationMethod[] | ListEnumVerificationMethodFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationMethodWithAggregatesFilter<$PrismaModel> | $Enums.VerificationMethod
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationMethodFilter<$PrismaModel>
    _max?: NestedEnumVerificationMethodFilter<$PrismaModel>
  }

  export type NestedEnumVerificationLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationLevel | EnumVerificationLevelFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationLevel[] | ListEnumVerificationLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationLevel[] | ListEnumVerificationLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationLevelWithAggregatesFilter<$PrismaModel> | $Enums.VerificationLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationLevelFilter<$PrismaModel>
    _max?: NestedEnumVerificationLevelFilter<$PrismaModel>
  }

  export type NestedEnumCheckResultFilter<$PrismaModel = never> = {
    equals?: $Enums.CheckResult | EnumCheckResultFieldRefInput<$PrismaModel>
    in?: $Enums.CheckResult[] | ListEnumCheckResultFieldRefInput<$PrismaModel>
    notIn?: $Enums.CheckResult[] | ListEnumCheckResultFieldRefInput<$PrismaModel>
    not?: NestedEnumCheckResultFilter<$PrismaModel> | $Enums.CheckResult
  }

  export type NestedEnumCheckResultWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CheckResult | EnumCheckResultFieldRefInput<$PrismaModel>
    in?: $Enums.CheckResult[] | ListEnumCheckResultFieldRefInput<$PrismaModel>
    notIn?: $Enums.CheckResult[] | ListEnumCheckResultFieldRefInput<$PrismaModel>
    not?: NestedEnumCheckResultWithAggregatesFilter<$PrismaModel> | $Enums.CheckResult
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCheckResultFilter<$PrismaModel>
    _max?: NestedEnumCheckResultFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumIntegrationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationType | EnumIntegrationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationType[] | ListEnumIntegrationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationType[] | ListEnumIntegrationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationTypeFilter<$PrismaModel> | $Enums.IntegrationType
  }

  export type NestedEnumConfidenceLevelNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.ConfidenceLevel | EnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    in?: $Enums.ConfidenceLevel[] | ListEnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ConfidenceLevel[] | ListEnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    not?: NestedEnumConfidenceLevelNullableFilter<$PrismaModel> | $Enums.ConfidenceLevel | null
  }

  export type NestedEnumIntegrationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationType | EnumIntegrationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.IntegrationType[] | ListEnumIntegrationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntegrationType[] | ListEnumIntegrationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumIntegrationTypeWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntegrationTypeFilter<$PrismaModel>
    _max?: NestedEnumIntegrationTypeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumConfidenceLevelNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ConfidenceLevel | EnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    in?: $Enums.ConfidenceLevel[] | ListEnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ConfidenceLevel[] | ListEnumConfidenceLevelFieldRefInput<$PrismaModel> | null
    not?: NestedEnumConfidenceLevelNullableWithAggregatesFilter<$PrismaModel> | $Enums.ConfidenceLevel | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumConfidenceLevelNullableFilter<$PrismaModel>
    _max?: NestedEnumConfidenceLevelNullableFilter<$PrismaModel>
  }

  export type CredentialCreateWithoutIssuerInput = {
    id?: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    subject: SubjectCreateNestedOneWithoutCredentialsInput
    achievement: AchievementCreateNestedOneWithoutCredentialsInput
    verifications?: VerificationCreateNestedManyWithoutCredentialInput
  }

  export type CredentialUncheckedCreateWithoutIssuerInput = {
    id?: string
    subjectId: string
    achievementId: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    verifications?: VerificationUncheckedCreateNestedManyWithoutCredentialInput
  }

  export type CredentialCreateOrConnectWithoutIssuerInput = {
    where: CredentialWhereUniqueInput
    create: XOR<CredentialCreateWithoutIssuerInput, CredentialUncheckedCreateWithoutIssuerInput>
  }

  export type CredentialCreateManyIssuerInputEnvelope = {
    data: CredentialCreateManyIssuerInput | CredentialCreateManyIssuerInput[]
    skipDuplicates?: boolean
  }

  export type IssuerAdapterCreateWithoutIssuerInput = {
    id?: string
    adapterName: string
    integrationType: $Enums.IntegrationType
    capabilities: JsonNullValueInput | InputJsonValue
    confidence?: $Enums.ConfidenceLevel | null
    notes?: string | null
    updatedAt?: Date | string
  }

  export type IssuerAdapterUncheckedCreateWithoutIssuerInput = {
    id?: string
    adapterName: string
    integrationType: $Enums.IntegrationType
    capabilities: JsonNullValueInput | InputJsonValue
    confidence?: $Enums.ConfidenceLevel | null
    notes?: string | null
    updatedAt?: Date | string
  }

  export type IssuerAdapterCreateOrConnectWithoutIssuerInput = {
    where: IssuerAdapterWhereUniqueInput
    create: XOR<IssuerAdapterCreateWithoutIssuerInput, IssuerAdapterUncheckedCreateWithoutIssuerInput>
  }

  export type IssuerAdapterCreateManyIssuerInputEnvelope = {
    data: IssuerAdapterCreateManyIssuerInput | IssuerAdapterCreateManyIssuerInput[]
    skipDuplicates?: boolean
  }

  export type TrustRegistryEntryCreateWithoutIssuerInput = {
    id?: string
    platformName?: string | null
    trustLevel: string
    notes?: string | null
    updatedAt?: Date | string
  }

  export type TrustRegistryEntryUncheckedCreateWithoutIssuerInput = {
    id?: string
    platformName?: string | null
    trustLevel: string
    notes?: string | null
    updatedAt?: Date | string
  }

  export type TrustRegistryEntryCreateOrConnectWithoutIssuerInput = {
    where: TrustRegistryEntryWhereUniqueInput
    create: XOR<TrustRegistryEntryCreateWithoutIssuerInput, TrustRegistryEntryUncheckedCreateWithoutIssuerInput>
  }

  export type TrustRegistryEntryCreateManyIssuerInputEnvelope = {
    data: TrustRegistryEntryCreateManyIssuerInput | TrustRegistryEntryCreateManyIssuerInput[]
    skipDuplicates?: boolean
  }

  export type CredentialUpsertWithWhereUniqueWithoutIssuerInput = {
    where: CredentialWhereUniqueInput
    update: XOR<CredentialUpdateWithoutIssuerInput, CredentialUncheckedUpdateWithoutIssuerInput>
    create: XOR<CredentialCreateWithoutIssuerInput, CredentialUncheckedCreateWithoutIssuerInput>
  }

  export type CredentialUpdateWithWhereUniqueWithoutIssuerInput = {
    where: CredentialWhereUniqueInput
    data: XOR<CredentialUpdateWithoutIssuerInput, CredentialUncheckedUpdateWithoutIssuerInput>
  }

  export type CredentialUpdateManyWithWhereWithoutIssuerInput = {
    where: CredentialScalarWhereInput
    data: XOR<CredentialUpdateManyMutationInput, CredentialUncheckedUpdateManyWithoutIssuerInput>
  }

  export type CredentialScalarWhereInput = {
    AND?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
    OR?: CredentialScalarWhereInput[]
    NOT?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
    id?: StringFilter<"Credential"> | string
    issuerId?: StringFilter<"Credential"> | string
    subjectId?: StringFilter<"Credential"> | string
    achievementId?: StringFilter<"Credential"> | string
    credentialType?: EnumCredentialTypeFilter<"Credential"> | $Enums.CredentialType
    issueDate?: DateTimeNullableFilter<"Credential"> | Date | string | null
    expirationDate?: DateTimeNullableFilter<"Credential"> | Date | string | null
    status?: EnumVerificationStatusFilter<"Credential"> | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFilter<"Credential"> | $Enums.CredentialInputType
    sourceIdentifier?: StringNullableFilter<"Credential"> | string | null
    rawMetadata?: JsonNullableFilter<"Credential">
    createdAt?: DateTimeFilter<"Credential"> | Date | string
    updatedAt?: DateTimeFilter<"Credential"> | Date | string
  }

  export type IssuerAdapterUpsertWithWhereUniqueWithoutIssuerInput = {
    where: IssuerAdapterWhereUniqueInput
    update: XOR<IssuerAdapterUpdateWithoutIssuerInput, IssuerAdapterUncheckedUpdateWithoutIssuerInput>
    create: XOR<IssuerAdapterCreateWithoutIssuerInput, IssuerAdapterUncheckedCreateWithoutIssuerInput>
  }

  export type IssuerAdapterUpdateWithWhereUniqueWithoutIssuerInput = {
    where: IssuerAdapterWhereUniqueInput
    data: XOR<IssuerAdapterUpdateWithoutIssuerInput, IssuerAdapterUncheckedUpdateWithoutIssuerInput>
  }

  export type IssuerAdapterUpdateManyWithWhereWithoutIssuerInput = {
    where: IssuerAdapterScalarWhereInput
    data: XOR<IssuerAdapterUpdateManyMutationInput, IssuerAdapterUncheckedUpdateManyWithoutIssuerInput>
  }

  export type IssuerAdapterScalarWhereInput = {
    AND?: IssuerAdapterScalarWhereInput | IssuerAdapterScalarWhereInput[]
    OR?: IssuerAdapterScalarWhereInput[]
    NOT?: IssuerAdapterScalarWhereInput | IssuerAdapterScalarWhereInput[]
    id?: StringFilter<"IssuerAdapter"> | string
    issuerId?: StringNullableFilter<"IssuerAdapter"> | string | null
    adapterName?: StringFilter<"IssuerAdapter"> | string
    integrationType?: EnumIntegrationTypeFilter<"IssuerAdapter"> | $Enums.IntegrationType
    capabilities?: JsonFilter<"IssuerAdapter">
    confidence?: EnumConfidenceLevelNullableFilter<"IssuerAdapter"> | $Enums.ConfidenceLevel | null
    notes?: StringNullableFilter<"IssuerAdapter"> | string | null
    updatedAt?: DateTimeFilter<"IssuerAdapter"> | Date | string
  }

  export type TrustRegistryEntryUpsertWithWhereUniqueWithoutIssuerInput = {
    where: TrustRegistryEntryWhereUniqueInput
    update: XOR<TrustRegistryEntryUpdateWithoutIssuerInput, TrustRegistryEntryUncheckedUpdateWithoutIssuerInput>
    create: XOR<TrustRegistryEntryCreateWithoutIssuerInput, TrustRegistryEntryUncheckedCreateWithoutIssuerInput>
  }

  export type TrustRegistryEntryUpdateWithWhereUniqueWithoutIssuerInput = {
    where: TrustRegistryEntryWhereUniqueInput
    data: XOR<TrustRegistryEntryUpdateWithoutIssuerInput, TrustRegistryEntryUncheckedUpdateWithoutIssuerInput>
  }

  export type TrustRegistryEntryUpdateManyWithWhereWithoutIssuerInput = {
    where: TrustRegistryEntryScalarWhereInput
    data: XOR<TrustRegistryEntryUpdateManyMutationInput, TrustRegistryEntryUncheckedUpdateManyWithoutIssuerInput>
  }

  export type TrustRegistryEntryScalarWhereInput = {
    AND?: TrustRegistryEntryScalarWhereInput | TrustRegistryEntryScalarWhereInput[]
    OR?: TrustRegistryEntryScalarWhereInput[]
    NOT?: TrustRegistryEntryScalarWhereInput | TrustRegistryEntryScalarWhereInput[]
    id?: StringFilter<"TrustRegistryEntry"> | string
    issuerId?: StringNullableFilter<"TrustRegistryEntry"> | string | null
    platformName?: StringNullableFilter<"TrustRegistryEntry"> | string | null
    trustLevel?: StringFilter<"TrustRegistryEntry"> | string
    notes?: StringNullableFilter<"TrustRegistryEntry"> | string | null
    updatedAt?: DateTimeFilter<"TrustRegistryEntry"> | Date | string
  }

  export type CredentialCreateWithoutSubjectInput = {
    id?: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    issuer: IssuerCreateNestedOneWithoutCredentialsInput
    achievement: AchievementCreateNestedOneWithoutCredentialsInput
    verifications?: VerificationCreateNestedManyWithoutCredentialInput
  }

  export type CredentialUncheckedCreateWithoutSubjectInput = {
    id?: string
    issuerId: string
    achievementId: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    verifications?: VerificationUncheckedCreateNestedManyWithoutCredentialInput
  }

  export type CredentialCreateOrConnectWithoutSubjectInput = {
    where: CredentialWhereUniqueInput
    create: XOR<CredentialCreateWithoutSubjectInput, CredentialUncheckedCreateWithoutSubjectInput>
  }

  export type CredentialCreateManySubjectInputEnvelope = {
    data: CredentialCreateManySubjectInput | CredentialCreateManySubjectInput[]
    skipDuplicates?: boolean
  }

  export type CredentialUpsertWithWhereUniqueWithoutSubjectInput = {
    where: CredentialWhereUniqueInput
    update: XOR<CredentialUpdateWithoutSubjectInput, CredentialUncheckedUpdateWithoutSubjectInput>
    create: XOR<CredentialCreateWithoutSubjectInput, CredentialUncheckedCreateWithoutSubjectInput>
  }

  export type CredentialUpdateWithWhereUniqueWithoutSubjectInput = {
    where: CredentialWhereUniqueInput
    data: XOR<CredentialUpdateWithoutSubjectInput, CredentialUncheckedUpdateWithoutSubjectInput>
  }

  export type CredentialUpdateManyWithWhereWithoutSubjectInput = {
    where: CredentialScalarWhereInput
    data: XOR<CredentialUpdateManyMutationInput, CredentialUncheckedUpdateManyWithoutSubjectInput>
  }

  export type CredentialCreateWithoutAchievementInput = {
    id?: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    issuer: IssuerCreateNestedOneWithoutCredentialsInput
    subject: SubjectCreateNestedOneWithoutCredentialsInput
    verifications?: VerificationCreateNestedManyWithoutCredentialInput
  }

  export type CredentialUncheckedCreateWithoutAchievementInput = {
    id?: string
    issuerId: string
    subjectId: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    verifications?: VerificationUncheckedCreateNestedManyWithoutCredentialInput
  }

  export type CredentialCreateOrConnectWithoutAchievementInput = {
    where: CredentialWhereUniqueInput
    create: XOR<CredentialCreateWithoutAchievementInput, CredentialUncheckedCreateWithoutAchievementInput>
  }

  export type CredentialCreateManyAchievementInputEnvelope = {
    data: CredentialCreateManyAchievementInput | CredentialCreateManyAchievementInput[]
    skipDuplicates?: boolean
  }

  export type CredentialUpsertWithWhereUniqueWithoutAchievementInput = {
    where: CredentialWhereUniqueInput
    update: XOR<CredentialUpdateWithoutAchievementInput, CredentialUncheckedUpdateWithoutAchievementInput>
    create: XOR<CredentialCreateWithoutAchievementInput, CredentialUncheckedCreateWithoutAchievementInput>
  }

  export type CredentialUpdateWithWhereUniqueWithoutAchievementInput = {
    where: CredentialWhereUniqueInput
    data: XOR<CredentialUpdateWithoutAchievementInput, CredentialUncheckedUpdateWithoutAchievementInput>
  }

  export type CredentialUpdateManyWithWhereWithoutAchievementInput = {
    where: CredentialScalarWhereInput
    data: XOR<CredentialUpdateManyMutationInput, CredentialUncheckedUpdateManyWithoutAchievementInput>
  }

  export type IssuerCreateWithoutCredentialsInput = {
    id?: string
    name: string
    domain?: string | null
    issuerType: string
    trustStatus?: $Enums.IssuerTrustStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    adapters?: IssuerAdapterCreateNestedManyWithoutIssuerInput
    trustRegistry?: TrustRegistryEntryCreateNestedManyWithoutIssuerInput
  }

  export type IssuerUncheckedCreateWithoutCredentialsInput = {
    id?: string
    name: string
    domain?: string | null
    issuerType: string
    trustStatus?: $Enums.IssuerTrustStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    adapters?: IssuerAdapterUncheckedCreateNestedManyWithoutIssuerInput
    trustRegistry?: TrustRegistryEntryUncheckedCreateNestedManyWithoutIssuerInput
  }

  export type IssuerCreateOrConnectWithoutCredentialsInput = {
    where: IssuerWhereUniqueInput
    create: XOR<IssuerCreateWithoutCredentialsInput, IssuerUncheckedCreateWithoutCredentialsInput>
  }

  export type SubjectCreateWithoutCredentialsInput = {
    id?: string
    name: string
    email?: string | null
    externalIdentifier?: string | null
    createdAt?: Date | string
  }

  export type SubjectUncheckedCreateWithoutCredentialsInput = {
    id?: string
    name: string
    email?: string | null
    externalIdentifier?: string | null
    createdAt?: Date | string
  }

  export type SubjectCreateOrConnectWithoutCredentialsInput = {
    where: SubjectWhereUniqueInput
    create: XOR<SubjectCreateWithoutCredentialsInput, SubjectUncheckedCreateWithoutCredentialsInput>
  }

  export type AchievementCreateWithoutCredentialsInput = {
    id?: string
    name: string
    description?: string | null
    credentialType: $Enums.CredentialType
    level?: string | null
    skills?: AchievementCreateskillsInput | string[]
    framework?: string | null
  }

  export type AchievementUncheckedCreateWithoutCredentialsInput = {
    id?: string
    name: string
    description?: string | null
    credentialType: $Enums.CredentialType
    level?: string | null
    skills?: AchievementCreateskillsInput | string[]
    framework?: string | null
  }

  export type AchievementCreateOrConnectWithoutCredentialsInput = {
    where: AchievementWhereUniqueInput
    create: XOR<AchievementCreateWithoutCredentialsInput, AchievementUncheckedCreateWithoutCredentialsInput>
  }

  export type VerificationCreateWithoutCredentialInput = {
    id?: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    checks?: VerificationCheckCreateNestedManyWithoutVerificationInput
    evidence?: VerificationEvidenceCreateNestedManyWithoutVerificationInput
    attempts?: VerificationAttemptCreateNestedManyWithoutVerificationInput
  }

  export type VerificationUncheckedCreateWithoutCredentialInput = {
    id?: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    checks?: VerificationCheckUncheckedCreateNestedManyWithoutVerificationInput
    evidence?: VerificationEvidenceUncheckedCreateNestedManyWithoutVerificationInput
    attempts?: VerificationAttemptUncheckedCreateNestedManyWithoutVerificationInput
  }

  export type VerificationCreateOrConnectWithoutCredentialInput = {
    where: VerificationWhereUniqueInput
    create: XOR<VerificationCreateWithoutCredentialInput, VerificationUncheckedCreateWithoutCredentialInput>
  }

  export type VerificationCreateManyCredentialInputEnvelope = {
    data: VerificationCreateManyCredentialInput | VerificationCreateManyCredentialInput[]
    skipDuplicates?: boolean
  }

  export type IssuerUpsertWithoutCredentialsInput = {
    update: XOR<IssuerUpdateWithoutCredentialsInput, IssuerUncheckedUpdateWithoutCredentialsInput>
    create: XOR<IssuerCreateWithoutCredentialsInput, IssuerUncheckedCreateWithoutCredentialsInput>
    where?: IssuerWhereInput
  }

  export type IssuerUpdateToOneWithWhereWithoutCredentialsInput = {
    where?: IssuerWhereInput
    data: XOR<IssuerUpdateWithoutCredentialsInput, IssuerUncheckedUpdateWithoutCredentialsInput>
  }

  export type IssuerUpdateWithoutCredentialsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    adapters?: IssuerAdapterUpdateManyWithoutIssuerNestedInput
    trustRegistry?: TrustRegistryEntryUpdateManyWithoutIssuerNestedInput
  }

  export type IssuerUncheckedUpdateWithoutCredentialsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    adapters?: IssuerAdapterUncheckedUpdateManyWithoutIssuerNestedInput
    trustRegistry?: TrustRegistryEntryUncheckedUpdateManyWithoutIssuerNestedInput
  }

  export type SubjectUpsertWithoutCredentialsInput = {
    update: XOR<SubjectUpdateWithoutCredentialsInput, SubjectUncheckedUpdateWithoutCredentialsInput>
    create: XOR<SubjectCreateWithoutCredentialsInput, SubjectUncheckedCreateWithoutCredentialsInput>
    where?: SubjectWhereInput
  }

  export type SubjectUpdateToOneWithWhereWithoutCredentialsInput = {
    where?: SubjectWhereInput
    data: XOR<SubjectUpdateWithoutCredentialsInput, SubjectUncheckedUpdateWithoutCredentialsInput>
  }

  export type SubjectUpdateWithoutCredentialsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    externalIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubjectUncheckedUpdateWithoutCredentialsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    externalIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AchievementUpsertWithoutCredentialsInput = {
    update: XOR<AchievementUpdateWithoutCredentialsInput, AchievementUncheckedUpdateWithoutCredentialsInput>
    create: XOR<AchievementCreateWithoutCredentialsInput, AchievementUncheckedCreateWithoutCredentialsInput>
    where?: AchievementWhereInput
  }

  export type AchievementUpdateToOneWithWhereWithoutCredentialsInput = {
    where?: AchievementWhereInput
    data: XOR<AchievementUpdateWithoutCredentialsInput, AchievementUncheckedUpdateWithoutCredentialsInput>
  }

  export type AchievementUpdateWithoutCredentialsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    level?: NullableStringFieldUpdateOperationsInput | string | null
    skills?: AchievementUpdateskillsInput | string[]
    framework?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AchievementUncheckedUpdateWithoutCredentialsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    level?: NullableStringFieldUpdateOperationsInput | string | null
    skills?: AchievementUpdateskillsInput | string[]
    framework?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type VerificationUpsertWithWhereUniqueWithoutCredentialInput = {
    where: VerificationWhereUniqueInput
    update: XOR<VerificationUpdateWithoutCredentialInput, VerificationUncheckedUpdateWithoutCredentialInput>
    create: XOR<VerificationCreateWithoutCredentialInput, VerificationUncheckedCreateWithoutCredentialInput>
  }

  export type VerificationUpdateWithWhereUniqueWithoutCredentialInput = {
    where: VerificationWhereUniqueInput
    data: XOR<VerificationUpdateWithoutCredentialInput, VerificationUncheckedUpdateWithoutCredentialInput>
  }

  export type VerificationUpdateManyWithWhereWithoutCredentialInput = {
    where: VerificationScalarWhereInput
    data: XOR<VerificationUpdateManyMutationInput, VerificationUncheckedUpdateManyWithoutCredentialInput>
  }

  export type VerificationScalarWhereInput = {
    AND?: VerificationScalarWhereInput | VerificationScalarWhereInput[]
    OR?: VerificationScalarWhereInput[]
    NOT?: VerificationScalarWhereInput | VerificationScalarWhereInput[]
    id?: StringFilter<"Verification"> | string
    credentialId?: StringFilter<"Verification"> | string
    method?: EnumVerificationMethodFilter<"Verification"> | $Enums.VerificationMethod
    provider?: StringNullableFilter<"Verification"> | string | null
    verificationLevel?: EnumVerificationLevelFilter<"Verification"> | $Enums.VerificationLevel
    verifiedAt?: DateTimeNullableFilter<"Verification"> | Date | string | null
    adapterVersion?: StringFilter<"Verification"> | string
    evidenceUrl?: StringNullableFilter<"Verification"> | string | null
    rawResponse?: JsonNullableFilter<"Verification">
    createdAt?: DateTimeFilter<"Verification"> | Date | string
  }

  export type CredentialCreateWithoutVerificationsInput = {
    id?: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    issuer: IssuerCreateNestedOneWithoutCredentialsInput
    subject: SubjectCreateNestedOneWithoutCredentialsInput
    achievement: AchievementCreateNestedOneWithoutCredentialsInput
  }

  export type CredentialUncheckedCreateWithoutVerificationsInput = {
    id?: string
    issuerId: string
    subjectId: string
    achievementId: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CredentialCreateOrConnectWithoutVerificationsInput = {
    where: CredentialWhereUniqueInput
    create: XOR<CredentialCreateWithoutVerificationsInput, CredentialUncheckedCreateWithoutVerificationsInput>
  }

  export type VerificationCheckCreateWithoutVerificationInput = {
    id?: string
    checkName: string
    result: $Enums.CheckResult
    detail?: string | null
  }

  export type VerificationCheckUncheckedCreateWithoutVerificationInput = {
    id?: string
    checkName: string
    result: $Enums.CheckResult
    detail?: string | null
  }

  export type VerificationCheckCreateOrConnectWithoutVerificationInput = {
    where: VerificationCheckWhereUniqueInput
    create: XOR<VerificationCheckCreateWithoutVerificationInput, VerificationCheckUncheckedCreateWithoutVerificationInput>
  }

  export type VerificationCheckCreateManyVerificationInputEnvelope = {
    data: VerificationCheckCreateManyVerificationInput | VerificationCheckCreateManyVerificationInput[]
    skipDuplicates?: boolean
  }

  export type VerificationEvidenceCreateWithoutVerificationInput = {
    id?: string
    evidenceType: string
    url?: string | null
    fileRef?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationEvidenceUncheckedCreateWithoutVerificationInput = {
    id?: string
    evidenceType: string
    url?: string | null
    fileRef?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationEvidenceCreateOrConnectWithoutVerificationInput = {
    where: VerificationEvidenceWhereUniqueInput
    create: XOR<VerificationEvidenceCreateWithoutVerificationInput, VerificationEvidenceUncheckedCreateWithoutVerificationInput>
  }

  export type VerificationEvidenceCreateManyVerificationInputEnvelope = {
    data: VerificationEvidenceCreateManyVerificationInput | VerificationEvidenceCreateManyVerificationInput[]
    skipDuplicates?: boolean
  }

  export type VerificationAttemptCreateWithoutVerificationInput = {
    id?: string
    attemptedAt?: Date | string
    outcome: string
    error?: string | null
    durationMs?: number | null
  }

  export type VerificationAttemptUncheckedCreateWithoutVerificationInput = {
    id?: string
    attemptedAt?: Date | string
    outcome: string
    error?: string | null
    durationMs?: number | null
  }

  export type VerificationAttemptCreateOrConnectWithoutVerificationInput = {
    where: VerificationAttemptWhereUniqueInput
    create: XOR<VerificationAttemptCreateWithoutVerificationInput, VerificationAttemptUncheckedCreateWithoutVerificationInput>
  }

  export type VerificationAttemptCreateManyVerificationInputEnvelope = {
    data: VerificationAttemptCreateManyVerificationInput | VerificationAttemptCreateManyVerificationInput[]
    skipDuplicates?: boolean
  }

  export type CredentialUpsertWithoutVerificationsInput = {
    update: XOR<CredentialUpdateWithoutVerificationsInput, CredentialUncheckedUpdateWithoutVerificationsInput>
    create: XOR<CredentialCreateWithoutVerificationsInput, CredentialUncheckedCreateWithoutVerificationsInput>
    where?: CredentialWhereInput
  }

  export type CredentialUpdateToOneWithWhereWithoutVerificationsInput = {
    where?: CredentialWhereInput
    data: XOR<CredentialUpdateWithoutVerificationsInput, CredentialUncheckedUpdateWithoutVerificationsInput>
  }

  export type CredentialUpdateWithoutVerificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuer?: IssuerUpdateOneRequiredWithoutCredentialsNestedInput
    subject?: SubjectUpdateOneRequiredWithoutCredentialsNestedInput
    achievement?: AchievementUpdateOneRequiredWithoutCredentialsNestedInput
  }

  export type CredentialUncheckedUpdateWithoutVerificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    achievementId?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCheckUpsertWithWhereUniqueWithoutVerificationInput = {
    where: VerificationCheckWhereUniqueInput
    update: XOR<VerificationCheckUpdateWithoutVerificationInput, VerificationCheckUncheckedUpdateWithoutVerificationInput>
    create: XOR<VerificationCheckCreateWithoutVerificationInput, VerificationCheckUncheckedCreateWithoutVerificationInput>
  }

  export type VerificationCheckUpdateWithWhereUniqueWithoutVerificationInput = {
    where: VerificationCheckWhereUniqueInput
    data: XOR<VerificationCheckUpdateWithoutVerificationInput, VerificationCheckUncheckedUpdateWithoutVerificationInput>
  }

  export type VerificationCheckUpdateManyWithWhereWithoutVerificationInput = {
    where: VerificationCheckScalarWhereInput
    data: XOR<VerificationCheckUpdateManyMutationInput, VerificationCheckUncheckedUpdateManyWithoutVerificationInput>
  }

  export type VerificationCheckScalarWhereInput = {
    AND?: VerificationCheckScalarWhereInput | VerificationCheckScalarWhereInput[]
    OR?: VerificationCheckScalarWhereInput[]
    NOT?: VerificationCheckScalarWhereInput | VerificationCheckScalarWhereInput[]
    id?: StringFilter<"VerificationCheck"> | string
    verificationId?: StringFilter<"VerificationCheck"> | string
    checkName?: StringFilter<"VerificationCheck"> | string
    result?: EnumCheckResultFilter<"VerificationCheck"> | $Enums.CheckResult
    detail?: StringNullableFilter<"VerificationCheck"> | string | null
  }

  export type VerificationEvidenceUpsertWithWhereUniqueWithoutVerificationInput = {
    where: VerificationEvidenceWhereUniqueInput
    update: XOR<VerificationEvidenceUpdateWithoutVerificationInput, VerificationEvidenceUncheckedUpdateWithoutVerificationInput>
    create: XOR<VerificationEvidenceCreateWithoutVerificationInput, VerificationEvidenceUncheckedCreateWithoutVerificationInput>
  }

  export type VerificationEvidenceUpdateWithWhereUniqueWithoutVerificationInput = {
    where: VerificationEvidenceWhereUniqueInput
    data: XOR<VerificationEvidenceUpdateWithoutVerificationInput, VerificationEvidenceUncheckedUpdateWithoutVerificationInput>
  }

  export type VerificationEvidenceUpdateManyWithWhereWithoutVerificationInput = {
    where: VerificationEvidenceScalarWhereInput
    data: XOR<VerificationEvidenceUpdateManyMutationInput, VerificationEvidenceUncheckedUpdateManyWithoutVerificationInput>
  }

  export type VerificationEvidenceScalarWhereInput = {
    AND?: VerificationEvidenceScalarWhereInput | VerificationEvidenceScalarWhereInput[]
    OR?: VerificationEvidenceScalarWhereInput[]
    NOT?: VerificationEvidenceScalarWhereInput | VerificationEvidenceScalarWhereInput[]
    id?: StringFilter<"VerificationEvidence"> | string
    verificationId?: StringFilter<"VerificationEvidence"> | string
    evidenceType?: StringFilter<"VerificationEvidence"> | string
    url?: StringNullableFilter<"VerificationEvidence"> | string | null
    fileRef?: StringNullableFilter<"VerificationEvidence"> | string | null
    metadata?: JsonNullableFilter<"VerificationEvidence">
  }

  export type VerificationAttemptUpsertWithWhereUniqueWithoutVerificationInput = {
    where: VerificationAttemptWhereUniqueInput
    update: XOR<VerificationAttemptUpdateWithoutVerificationInput, VerificationAttemptUncheckedUpdateWithoutVerificationInput>
    create: XOR<VerificationAttemptCreateWithoutVerificationInput, VerificationAttemptUncheckedCreateWithoutVerificationInput>
  }

  export type VerificationAttemptUpdateWithWhereUniqueWithoutVerificationInput = {
    where: VerificationAttemptWhereUniqueInput
    data: XOR<VerificationAttemptUpdateWithoutVerificationInput, VerificationAttemptUncheckedUpdateWithoutVerificationInput>
  }

  export type VerificationAttemptUpdateManyWithWhereWithoutVerificationInput = {
    where: VerificationAttemptScalarWhereInput
    data: XOR<VerificationAttemptUpdateManyMutationInput, VerificationAttemptUncheckedUpdateManyWithoutVerificationInput>
  }

  export type VerificationAttemptScalarWhereInput = {
    AND?: VerificationAttemptScalarWhereInput | VerificationAttemptScalarWhereInput[]
    OR?: VerificationAttemptScalarWhereInput[]
    NOT?: VerificationAttemptScalarWhereInput | VerificationAttemptScalarWhereInput[]
    id?: StringFilter<"VerificationAttempt"> | string
    verificationId?: StringFilter<"VerificationAttempt"> | string
    attemptedAt?: DateTimeFilter<"VerificationAttempt"> | Date | string
    outcome?: StringFilter<"VerificationAttempt"> | string
    error?: StringNullableFilter<"VerificationAttempt"> | string | null
    durationMs?: IntNullableFilter<"VerificationAttempt"> | number | null
  }

  export type VerificationCreateWithoutChecksInput = {
    id?: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    credential: CredentialCreateNestedOneWithoutVerificationsInput
    evidence?: VerificationEvidenceCreateNestedManyWithoutVerificationInput
    attempts?: VerificationAttemptCreateNestedManyWithoutVerificationInput
  }

  export type VerificationUncheckedCreateWithoutChecksInput = {
    id?: string
    credentialId: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    evidence?: VerificationEvidenceUncheckedCreateNestedManyWithoutVerificationInput
    attempts?: VerificationAttemptUncheckedCreateNestedManyWithoutVerificationInput
  }

  export type VerificationCreateOrConnectWithoutChecksInput = {
    where: VerificationWhereUniqueInput
    create: XOR<VerificationCreateWithoutChecksInput, VerificationUncheckedCreateWithoutChecksInput>
  }

  export type VerificationUpsertWithoutChecksInput = {
    update: XOR<VerificationUpdateWithoutChecksInput, VerificationUncheckedUpdateWithoutChecksInput>
    create: XOR<VerificationCreateWithoutChecksInput, VerificationUncheckedCreateWithoutChecksInput>
    where?: VerificationWhereInput
  }

  export type VerificationUpdateToOneWithWhereWithoutChecksInput = {
    where?: VerificationWhereInput
    data: XOR<VerificationUpdateWithoutChecksInput, VerificationUncheckedUpdateWithoutChecksInput>
  }

  export type VerificationUpdateWithoutChecksInput = {
    id?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credential?: CredentialUpdateOneRequiredWithoutVerificationsNestedInput
    evidence?: VerificationEvidenceUpdateManyWithoutVerificationNestedInput
    attempts?: VerificationAttemptUpdateManyWithoutVerificationNestedInput
  }

  export type VerificationUncheckedUpdateWithoutChecksInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialId?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    evidence?: VerificationEvidenceUncheckedUpdateManyWithoutVerificationNestedInput
    attempts?: VerificationAttemptUncheckedUpdateManyWithoutVerificationNestedInput
  }

  export type VerificationCreateWithoutEvidenceInput = {
    id?: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    credential: CredentialCreateNestedOneWithoutVerificationsInput
    checks?: VerificationCheckCreateNestedManyWithoutVerificationInput
    attempts?: VerificationAttemptCreateNestedManyWithoutVerificationInput
  }

  export type VerificationUncheckedCreateWithoutEvidenceInput = {
    id?: string
    credentialId: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    checks?: VerificationCheckUncheckedCreateNestedManyWithoutVerificationInput
    attempts?: VerificationAttemptUncheckedCreateNestedManyWithoutVerificationInput
  }

  export type VerificationCreateOrConnectWithoutEvidenceInput = {
    where: VerificationWhereUniqueInput
    create: XOR<VerificationCreateWithoutEvidenceInput, VerificationUncheckedCreateWithoutEvidenceInput>
  }

  export type VerificationUpsertWithoutEvidenceInput = {
    update: XOR<VerificationUpdateWithoutEvidenceInput, VerificationUncheckedUpdateWithoutEvidenceInput>
    create: XOR<VerificationCreateWithoutEvidenceInput, VerificationUncheckedCreateWithoutEvidenceInput>
    where?: VerificationWhereInput
  }

  export type VerificationUpdateToOneWithWhereWithoutEvidenceInput = {
    where?: VerificationWhereInput
    data: XOR<VerificationUpdateWithoutEvidenceInput, VerificationUncheckedUpdateWithoutEvidenceInput>
  }

  export type VerificationUpdateWithoutEvidenceInput = {
    id?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credential?: CredentialUpdateOneRequiredWithoutVerificationsNestedInput
    checks?: VerificationCheckUpdateManyWithoutVerificationNestedInput
    attempts?: VerificationAttemptUpdateManyWithoutVerificationNestedInput
  }

  export type VerificationUncheckedUpdateWithoutEvidenceInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialId?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checks?: VerificationCheckUncheckedUpdateManyWithoutVerificationNestedInput
    attempts?: VerificationAttemptUncheckedUpdateManyWithoutVerificationNestedInput
  }

  export type VerificationCreateWithoutAttemptsInput = {
    id?: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    credential: CredentialCreateNestedOneWithoutVerificationsInput
    checks?: VerificationCheckCreateNestedManyWithoutVerificationInput
    evidence?: VerificationEvidenceCreateNestedManyWithoutVerificationInput
  }

  export type VerificationUncheckedCreateWithoutAttemptsInput = {
    id?: string
    credentialId: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    checks?: VerificationCheckUncheckedCreateNestedManyWithoutVerificationInput
    evidence?: VerificationEvidenceUncheckedCreateNestedManyWithoutVerificationInput
  }

  export type VerificationCreateOrConnectWithoutAttemptsInput = {
    where: VerificationWhereUniqueInput
    create: XOR<VerificationCreateWithoutAttemptsInput, VerificationUncheckedCreateWithoutAttemptsInput>
  }

  export type VerificationUpsertWithoutAttemptsInput = {
    update: XOR<VerificationUpdateWithoutAttemptsInput, VerificationUncheckedUpdateWithoutAttemptsInput>
    create: XOR<VerificationCreateWithoutAttemptsInput, VerificationUncheckedCreateWithoutAttemptsInput>
    where?: VerificationWhereInput
  }

  export type VerificationUpdateToOneWithWhereWithoutAttemptsInput = {
    where?: VerificationWhereInput
    data: XOR<VerificationUpdateWithoutAttemptsInput, VerificationUncheckedUpdateWithoutAttemptsInput>
  }

  export type VerificationUpdateWithoutAttemptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credential?: CredentialUpdateOneRequiredWithoutVerificationsNestedInput
    checks?: VerificationCheckUpdateManyWithoutVerificationNestedInput
    evidence?: VerificationEvidenceUpdateManyWithoutVerificationNestedInput
  }

  export type VerificationUncheckedUpdateWithoutAttemptsInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialId?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checks?: VerificationCheckUncheckedUpdateManyWithoutVerificationNestedInput
    evidence?: VerificationEvidenceUncheckedUpdateManyWithoutVerificationNestedInput
  }

  export type IssuerCreateWithoutAdaptersInput = {
    id?: string
    name: string
    domain?: string | null
    issuerType: string
    trustStatus?: $Enums.IssuerTrustStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    credentials?: CredentialCreateNestedManyWithoutIssuerInput
    trustRegistry?: TrustRegistryEntryCreateNestedManyWithoutIssuerInput
  }

  export type IssuerUncheckedCreateWithoutAdaptersInput = {
    id?: string
    name: string
    domain?: string | null
    issuerType: string
    trustStatus?: $Enums.IssuerTrustStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    credentials?: CredentialUncheckedCreateNestedManyWithoutIssuerInput
    trustRegistry?: TrustRegistryEntryUncheckedCreateNestedManyWithoutIssuerInput
  }

  export type IssuerCreateOrConnectWithoutAdaptersInput = {
    where: IssuerWhereUniqueInput
    create: XOR<IssuerCreateWithoutAdaptersInput, IssuerUncheckedCreateWithoutAdaptersInput>
  }

  export type IssuerUpsertWithoutAdaptersInput = {
    update: XOR<IssuerUpdateWithoutAdaptersInput, IssuerUncheckedUpdateWithoutAdaptersInput>
    create: XOR<IssuerCreateWithoutAdaptersInput, IssuerUncheckedCreateWithoutAdaptersInput>
    where?: IssuerWhereInput
  }

  export type IssuerUpdateToOneWithWhereWithoutAdaptersInput = {
    where?: IssuerWhereInput
    data: XOR<IssuerUpdateWithoutAdaptersInput, IssuerUncheckedUpdateWithoutAdaptersInput>
  }

  export type IssuerUpdateWithoutAdaptersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUpdateManyWithoutIssuerNestedInput
    trustRegistry?: TrustRegistryEntryUpdateManyWithoutIssuerNestedInput
  }

  export type IssuerUncheckedUpdateWithoutAdaptersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUncheckedUpdateManyWithoutIssuerNestedInput
    trustRegistry?: TrustRegistryEntryUncheckedUpdateManyWithoutIssuerNestedInput
  }

  export type IssuerCreateWithoutTrustRegistryInput = {
    id?: string
    name: string
    domain?: string | null
    issuerType: string
    trustStatus?: $Enums.IssuerTrustStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    credentials?: CredentialCreateNestedManyWithoutIssuerInput
    adapters?: IssuerAdapterCreateNestedManyWithoutIssuerInput
  }

  export type IssuerUncheckedCreateWithoutTrustRegistryInput = {
    id?: string
    name: string
    domain?: string | null
    issuerType: string
    trustStatus?: $Enums.IssuerTrustStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    credentials?: CredentialUncheckedCreateNestedManyWithoutIssuerInput
    adapters?: IssuerAdapterUncheckedCreateNestedManyWithoutIssuerInput
  }

  export type IssuerCreateOrConnectWithoutTrustRegistryInput = {
    where: IssuerWhereUniqueInput
    create: XOR<IssuerCreateWithoutTrustRegistryInput, IssuerUncheckedCreateWithoutTrustRegistryInput>
  }

  export type IssuerUpsertWithoutTrustRegistryInput = {
    update: XOR<IssuerUpdateWithoutTrustRegistryInput, IssuerUncheckedUpdateWithoutTrustRegistryInput>
    create: XOR<IssuerCreateWithoutTrustRegistryInput, IssuerUncheckedCreateWithoutTrustRegistryInput>
    where?: IssuerWhereInput
  }

  export type IssuerUpdateToOneWithWhereWithoutTrustRegistryInput = {
    where?: IssuerWhereInput
    data: XOR<IssuerUpdateWithoutTrustRegistryInput, IssuerUncheckedUpdateWithoutTrustRegistryInput>
  }

  export type IssuerUpdateWithoutTrustRegistryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUpdateManyWithoutIssuerNestedInput
    adapters?: IssuerAdapterUpdateManyWithoutIssuerNestedInput
  }

  export type IssuerUncheckedUpdateWithoutTrustRegistryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    domain?: NullableStringFieldUpdateOperationsInput | string | null
    issuerType?: StringFieldUpdateOperationsInput | string
    trustStatus?: EnumIssuerTrustStatusFieldUpdateOperationsInput | $Enums.IssuerTrustStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUncheckedUpdateManyWithoutIssuerNestedInput
    adapters?: IssuerAdapterUncheckedUpdateManyWithoutIssuerNestedInput
  }

  export type CredentialCreateManyIssuerInput = {
    id?: string
    subjectId: string
    achievementId: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type IssuerAdapterCreateManyIssuerInput = {
    id?: string
    adapterName: string
    integrationType: $Enums.IntegrationType
    capabilities: JsonNullValueInput | InputJsonValue
    confidence?: $Enums.ConfidenceLevel | null
    notes?: string | null
    updatedAt?: Date | string
  }

  export type TrustRegistryEntryCreateManyIssuerInput = {
    id?: string
    platformName?: string | null
    trustLevel: string
    notes?: string | null
    updatedAt?: Date | string
  }

  export type CredentialUpdateWithoutIssuerInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subject?: SubjectUpdateOneRequiredWithoutCredentialsNestedInput
    achievement?: AchievementUpdateOneRequiredWithoutCredentialsNestedInput
    verifications?: VerificationUpdateManyWithoutCredentialNestedInput
  }

  export type CredentialUncheckedUpdateWithoutIssuerInput = {
    id?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    achievementId?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    verifications?: VerificationUncheckedUpdateManyWithoutCredentialNestedInput
  }

  export type CredentialUncheckedUpdateManyWithoutIssuerInput = {
    id?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    achievementId?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IssuerAdapterUpdateWithoutIssuerInput = {
    id?: StringFieldUpdateOperationsInput | string
    adapterName?: StringFieldUpdateOperationsInput | string
    integrationType?: EnumIntegrationTypeFieldUpdateOperationsInput | $Enums.IntegrationType
    capabilities?: JsonNullValueInput | InputJsonValue
    confidence?: NullableEnumConfidenceLevelFieldUpdateOperationsInput | $Enums.ConfidenceLevel | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IssuerAdapterUncheckedUpdateWithoutIssuerInput = {
    id?: StringFieldUpdateOperationsInput | string
    adapterName?: StringFieldUpdateOperationsInput | string
    integrationType?: EnumIntegrationTypeFieldUpdateOperationsInput | $Enums.IntegrationType
    capabilities?: JsonNullValueInput | InputJsonValue
    confidence?: NullableEnumConfidenceLevelFieldUpdateOperationsInput | $Enums.ConfidenceLevel | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IssuerAdapterUncheckedUpdateManyWithoutIssuerInput = {
    id?: StringFieldUpdateOperationsInput | string
    adapterName?: StringFieldUpdateOperationsInput | string
    integrationType?: EnumIntegrationTypeFieldUpdateOperationsInput | $Enums.IntegrationType
    capabilities?: JsonNullValueInput | InputJsonValue
    confidence?: NullableEnumConfidenceLevelFieldUpdateOperationsInput | $Enums.ConfidenceLevel | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TrustRegistryEntryUpdateWithoutIssuerInput = {
    id?: StringFieldUpdateOperationsInput | string
    platformName?: NullableStringFieldUpdateOperationsInput | string | null
    trustLevel?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TrustRegistryEntryUncheckedUpdateWithoutIssuerInput = {
    id?: StringFieldUpdateOperationsInput | string
    platformName?: NullableStringFieldUpdateOperationsInput | string | null
    trustLevel?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TrustRegistryEntryUncheckedUpdateManyWithoutIssuerInput = {
    id?: StringFieldUpdateOperationsInput | string
    platformName?: NullableStringFieldUpdateOperationsInput | string | null
    trustLevel?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CredentialCreateManySubjectInput = {
    id?: string
    issuerId: string
    achievementId: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CredentialUpdateWithoutSubjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuer?: IssuerUpdateOneRequiredWithoutCredentialsNestedInput
    achievement?: AchievementUpdateOneRequiredWithoutCredentialsNestedInput
    verifications?: VerificationUpdateManyWithoutCredentialNestedInput
  }

  export type CredentialUncheckedUpdateWithoutSubjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: StringFieldUpdateOperationsInput | string
    achievementId?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    verifications?: VerificationUncheckedUpdateManyWithoutCredentialNestedInput
  }

  export type CredentialUncheckedUpdateManyWithoutSubjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: StringFieldUpdateOperationsInput | string
    achievementId?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CredentialCreateManyAchievementInput = {
    id?: string
    issuerId: string
    subjectId: string
    credentialType: $Enums.CredentialType
    issueDate?: Date | string | null
    expirationDate?: Date | string | null
    status?: $Enums.VerificationStatus
    source: $Enums.CredentialInputType
    sourceIdentifier?: string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CredentialUpdateWithoutAchievementInput = {
    id?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuer?: IssuerUpdateOneRequiredWithoutCredentialsNestedInput
    subject?: SubjectUpdateOneRequiredWithoutCredentialsNestedInput
    verifications?: VerificationUpdateManyWithoutCredentialNestedInput
  }

  export type CredentialUncheckedUpdateWithoutAchievementInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    verifications?: VerificationUncheckedUpdateManyWithoutCredentialNestedInput
  }

  export type CredentialUncheckedUpdateManyWithoutAchievementInput = {
    id?: StringFieldUpdateOperationsInput | string
    issuerId?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    credentialType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    issueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expirationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    source?: EnumCredentialInputTypeFieldUpdateOperationsInput | $Enums.CredentialInputType
    sourceIdentifier?: NullableStringFieldUpdateOperationsInput | string | null
    rawMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCreateManyCredentialInput = {
    id?: string
    method: $Enums.VerificationMethod
    provider?: string | null
    verificationLevel?: $Enums.VerificationLevel
    verifiedAt?: Date | string | null
    adapterVersion: string
    evidenceUrl?: string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type VerificationUpdateWithoutCredentialInput = {
    id?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checks?: VerificationCheckUpdateManyWithoutVerificationNestedInput
    evidence?: VerificationEvidenceUpdateManyWithoutVerificationNestedInput
    attempts?: VerificationAttemptUpdateManyWithoutVerificationNestedInput
  }

  export type VerificationUncheckedUpdateWithoutCredentialInput = {
    id?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checks?: VerificationCheckUncheckedUpdateManyWithoutVerificationNestedInput
    evidence?: VerificationEvidenceUncheckedUpdateManyWithoutVerificationNestedInput
    attempts?: VerificationAttemptUncheckedUpdateManyWithoutVerificationNestedInput
  }

  export type VerificationUncheckedUpdateManyWithoutCredentialInput = {
    id?: StringFieldUpdateOperationsInput | string
    method?: EnumVerificationMethodFieldUpdateOperationsInput | $Enums.VerificationMethod
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    verificationLevel?: EnumVerificationLevelFieldUpdateOperationsInput | $Enums.VerificationLevel
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    adapterVersion?: StringFieldUpdateOperationsInput | string
    evidenceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    rawResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCheckCreateManyVerificationInput = {
    id?: string
    checkName: string
    result: $Enums.CheckResult
    detail?: string | null
  }

  export type VerificationEvidenceCreateManyVerificationInput = {
    id?: string
    evidenceType: string
    url?: string | null
    fileRef?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationAttemptCreateManyVerificationInput = {
    id?: string
    attemptedAt?: Date | string
    outcome: string
    error?: string | null
    durationMs?: number | null
  }

  export type VerificationCheckUpdateWithoutVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkName?: StringFieldUpdateOperationsInput | string
    result?: EnumCheckResultFieldUpdateOperationsInput | $Enums.CheckResult
    detail?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type VerificationCheckUncheckedUpdateWithoutVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkName?: StringFieldUpdateOperationsInput | string
    result?: EnumCheckResultFieldUpdateOperationsInput | $Enums.CheckResult
    detail?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type VerificationCheckUncheckedUpdateManyWithoutVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkName?: StringFieldUpdateOperationsInput | string
    result?: EnumCheckResultFieldUpdateOperationsInput | $Enums.CheckResult
    detail?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type VerificationEvidenceUpdateWithoutVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    evidenceType?: StringFieldUpdateOperationsInput | string
    url?: NullableStringFieldUpdateOperationsInput | string | null
    fileRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationEvidenceUncheckedUpdateWithoutVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    evidenceType?: StringFieldUpdateOperationsInput | string
    url?: NullableStringFieldUpdateOperationsInput | string | null
    fileRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationEvidenceUncheckedUpdateManyWithoutVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    evidenceType?: StringFieldUpdateOperationsInput | string
    url?: NullableStringFieldUpdateOperationsInput | string | null
    fileRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type VerificationAttemptUpdateWithoutVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    attemptedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type VerificationAttemptUncheckedUpdateWithoutVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    attemptedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type VerificationAttemptUncheckedUpdateManyWithoutVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    attemptedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    outcome?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}