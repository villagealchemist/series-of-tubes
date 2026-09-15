import express, {
  type ErrorRequestHandler,
  type Express,
  type RequestHandler,
} from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { ValidateError } from "tsoa";
import { RegisterRoutes } from "../../.generated/routes.js";
import { ContractProposalProviderUnavailableError } from "./providers/ContractProposalProvider.js";
import { ContractNotFoundError } from "./services/ContractService.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function loadOpenApiDocument(): Record<string, unknown> {
  const documentPath = path.join(
    process.cwd(),
    "docs",
    "generated",
    "swagger.json",
  );
  const parsed: unknown = JSON.parse(readFileSync(documentPath, "utf8"));
  if (!isRecord(parsed)) {
    throw new Error("Generated OpenAPI document must be a JSON object.");
  }
  return parsed;
}

function validationFields(error: ValidateError): Array<{
  path: string;
  message: string;
}> {
  return Object.entries(error.fields).map(([pathName, field]) => ({
    path: pathName,
    message: field.message,
  }));
}

const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    code: "ROUTE_NOT_FOUND",
    message: "The requested AAPI route does not exist.",
  });
};

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  if (error instanceof ValidateError) {
    response.status(422).json({
      code: "VALIDATION_FAILED",
      message: "The request did not match the generated API contract.",
      fields: validationFields(error),
    });
    return;
  }

  if (error instanceof ContractNotFoundError) {
    response
      .status(404)
      .json({ code: "CONTRACT_NOT_FOUND", message: error.message });
    return;
  }

  if (error instanceof ContractProposalProviderUnavailableError) {
    response.status(503).json({
      code: "PROPOSAL_PROVIDER_UNAVAILABLE",
      message: error.message,
    });
    return;
  }

  response.status(500).json({
    code: "INTERNAL_ERROR",
    message: "The AAPI could not complete the request.",
  });
};

export function createApp(): Express {
  const app = express();
  const openApiDocument = loadOpenApiDocument();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.get("/openapi.json", (_request, response) => {
    response.json(openApiDocument);
  });
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "AAPI contract reference",
    }),
  );

  RegisterRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
