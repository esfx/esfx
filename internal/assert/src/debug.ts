/*!
  Copyright 2018 Ron Buckton (rbuckton@chronicles.org)

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 */

interface ErrorConstructorWithStackTraceApi extends ErrorConstructor {
    captureStackTrace(target: any, stackCrawlMark?: Function): void;
}

declare const Error: ErrorConstructorWithStackTraceApi;

/** @internal */
export function captureStackTrace(error: any, stackCrawlMark?: Function) {
    if (typeof error === "object" && error !== null && Error.captureStackTrace) {
        Error.captureStackTrace(error, stackCrawlMark || captureStackTrace);
    }
}
