// @ts-check
const ts = require("typescript");

/**
 * @template {ts.SyntaxKind} [T=ts.SyntaxKind]
 * @typedef {ts.Token<T>} Tok
 */

/**
 * @typedef {ts.Expression} Expr
 */

/**
 * @typedef {ts.Statement} Stmt
 */

/**
 * @template {string} [T=string]
 * @typedef {string extends T ? ts.Identifier : ts.Identifier & { readonly escapedText: ts.__String & (T extends `__${infer R}` ? `___${R}` : T) }} Id
 */

/**
 * @template {Expr | string} L
 * @template {Id | string} R
 * @typedef {ts.PropertyAccessExpression & { readonly expression: L extends string ? Id<L> : L, readonly name: R extends string ? Id<R> : R }} Prop
 */

/**
 * @template {ts.BinaryOperator | ts.BinaryOperatorToken} [T=ts.BinaryOperatorToken]
 * @template {Expr} [L=Expr]
 * @template {Expr} [R=Expr]
 * @typedef {ts.BinaryExpression & { readonly left: L, readonly operatorToken: T extends ts.BinaryOperator ? Tok<T> : T, readonly right: R }} BinOp
 */

/**
 * @template {Expr} [L=Expr]
 * @template {Expr} [R=Expr]
 * @typedef {BinOp<ts.SyntaxKind.BarBarToken, L, R>} LogicalOr
 */

/**
 * @template {Expr} [L=Expr]
 * @template {Expr} [R=Expr]
 * @typedef {BinOp<ts.EqualsToken, L, R>} Assign
 */

/**
 * @template {Expr} T
 * @typedef {ts.ParenthesizedExpression & { readonly expression: T }} Paren
 */

/**
 * @template {Expr} E
 * @template {readonly Expr[]} A
 * @typedef {ts.CallExpression & { readonly expression: E, readonly arguments: Readonly<A> }} Call
 */

/**
 * @typedef {Call<Id<"require">, [ts.StringLiteral]>} RequireCall
 */

/**
 * @template {string} [H=string]
 * @template {Expr[]} [A=Expr[]]
 * @typedef {Call<Prop<Id, H> | Id<H>, A>} HelperCall
 */

/**
 * @template {ts.ObjectLiteralElement[]} [P=ts.ObjectLiteralElement[]]
 * @typedef {ts.ObjectLiteralExpression & { readonly properties: Readonly<P> }} Obj
 */

/**
 * @template {ts.PropertyName | string} P
 * @template {Expr} I
 * @typedef {ts.PropertyAssignment & { readonly name: P extends string ? Id<P> : P, readonly initializer: I }} PropAssign
 */

/**
 * @template {Expr | undefined} [E=undefined]
 * @typedef {ts.ReturnStatement & { readonly expression: E }} Ret
 */

/**
 * @template {Stmt[]} S
 * @typedef {ts.Block & { readonly statements: Readonly<S> }} Block
 */

/**
 * @template {ts.ParameterDeclaration[]} P
 * @template {Stmt[]} S
 * @typedef {ts.FunctionExpression & { readonly parameters: Readonly<P>, readonly body: Block<S> }} FuncExpr
 */

/**
 * @typedef {Obj<[]>} EmptyObj
 */

/**
 * @template {ts.BindingName} N
 * @template {Expr | undefined} E
 * @typedef {ts.VariableDeclaration & { readonly name: N, readonly initializer: E }} VarDecl
 */

/**
 * @template {readonly VarDecl<ts.BindingName, Expr | undefined>[]} N
 * @template {"var" | "let" | "const"} [M="var" | "let" | "const"]
 * @typedef {ts.VariableDeclarationList & { readonly declarations: Readonly<N>, readonly __typeBrand: M }} VarDecls
 */

/**
 * @template {readonly VarDecl<ts.BindingName, Expr | undefined>[]} N
 * @template {"var" | "let" | "const"} [M="var" | "let" | "const"]
 * @typedef {ts.VariableStatement & { readonly declarationList: VarDecls<N, M> }} VarStmt
 */

/**
 * @template {ts.Identifier} N
 * @template {Expr | undefined} E
 * @template {"var" | "let" | "const"} [M="var" | "let" | "const"]
 * @typedef {VarStmt<[VarDecl<N, E>], M>} SimpleVar
 */

/** @typedef {SimpleVar<ts.Identifier, undefined>} SimpleUninitalizedVar */
/** @typedef {Id<"exports">} ExportsId */
/** @typedef {Prop<ExportsId, string>} ExportBindingExpression */
/** @typedef {Assign<ExportBindingExpression, Expr>} ExportAssignmentExpression */
/** @typedef {Assign<Id, LogicalOr<ExportBindingExpression, Paren<Assign<ExportBindingExpression, EmptyObj>>>>} ExportNamespaceBindingExpression */
/** @typedef {Call<Paren<ts.FunctionExpression>, [ExportNamespaceBindingExpression]>} ExportNamespaceIIFE */
/** @typedef {HelperCall<"__exportStar", [RequireCall, ExportsId]>} ExportStar */
/** @typedef {SimpleVar<Id, RequireCall, "const">} ImportAssignment */
/** @typedef {SimpleVar<Id, HelperCall<"__importDefault", [RequireCall]>, "const">} ImportInteropAssignment */
/** @typedef {SimpleVar<Id, HelperCall<"__importStar", [RequireCall]>, "const">} ImportStar */
/** @typedef {Call<Prop<"Object", "defineProperty">, [ExportsId, ts.StringLiteral, Obj<[PropAssign<"enumerable", ts.TrueLiteral>, PropAssign<"get", FuncExpr<[], [Ret<Prop<Id, Id>>]>>]>]>} Reexport */

module.exports = {};