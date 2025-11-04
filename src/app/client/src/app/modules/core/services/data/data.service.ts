
import { of as observableOf, throwError as observableThrowError, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { ServerResponse, RequestParam, HttpOptions } from '@sunbird/shared';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { v4 as UUID } from 'uuid';
import dayjs from 'dayjs';

/**
 * Service to provide base CRUD methods to make api request.
 *
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  static userId: string;
  static sessionId: string;
  /**
   * Contains rootOrg Id
   */
  rootOrgId: string;
  /**
   * Contains channel Id
   */
  channelId: string;
  /**
  * Contains appId
  */
  appId: string;
  /**
   * Contains devoce Id
   */
  deviceId: string;
  /**
   * Contains base Url for api end points
   */
  baseUrl: string;
  /**
   * angular HttpClient
   */
  http: HttpClient;
  /**
   * Constructor
   * @param {HttpClient} http HttpClient reference
   */
  appVersion: string;
  constructor(http: HttpClient) {
    this.http = http;
    const buildNumber = (<HTMLInputElement>document.getElementById('buildNumber'));
    this.appVersion = buildNumber && buildNumber.value ? buildNumber.value.slice(0, buildNumber.value.lastIndexOf('.')) : '1.0';
  }

  /**
   * for making get api calls which needs headers in response
   *  headers are fetched to get server time using Date attribute in header
   * @param requestParam interface
   */
  getWithHeaders(requestParam: RequestParam): Observable<ServerResponse> {
    const httpOptions: HttpOptions = {
      headers: requestParam.header ? requestParam.header : this.getHeader(),
      params: requestParam.param,
      observe: 'response'
    };
    return this.http.get(this.baseUrl + requestParam.url, httpOptions).pipe(
      mergeMap(({ body, headers }: any) => {
        // replace ts time with header date , this value is used in telemetry
        body.ts = this.getDateDiff((headers.get('Date')));
        if (body.responseCode !== 'OK') {
          return observableThrowError(body);
        }
        return observableOf(body);
      }));
  }

  /**
   * for making get api calls
   *
   * @param requestParam interface
   */
  get(requestParam: RequestParam): Observable<ServerResponse> {
    const httpOptions: HttpOptions = {
      headers: requestParam.header ? requestParam.header : this.getHeader(),
      params: requestParam.param
    };
    return this.http.get(this.baseUrl + requestParam.url, httpOptions).pipe(
      mergeMap((data: ServerResponse) => {
        if (data.responseCode !== 'OK') {
          return observableThrowError(data);
        }
        return observableOf(data);
      }));
  }

  /**
   * for making post api calls with headers in response object
   *
   * @param {RequestParam} requestParam interface
   *
   */
  postWithHeaders(requestParam: RequestParam): Observable<any> {
    const httpOptions: HttpOptions = {
      headers: requestParam.header ? this.getHeader(requestParam.header) : this.getHeader(),
      params: requestParam.param,
      observe: 'response'
    };
    return this.http.post(this.baseUrl + requestParam.url, requestParam.data, httpOptions).pipe(
      mergeMap(({ body, headers }: any) => {
        // replace ts time with header date , this value is used in telemetry
        body.ts = this.getDateDiff((headers.get('Date')));
        if (body.responseCode !== 'OK') {
          return observableThrowError(body);
        }
        return observableOf(body);
      }));
  }

  /**
   * for making post api calls
   * @param {RequestParam} requestParam interface
   */
  post(requestParam: RequestParam): Observable<ServerResponse> {
    const httpOptions: HttpOptions = {
      headers: requestParam.header ? this.getHeader(requestParam.header) : this.getHeader(),
      params: requestParam.param
    };
    return this.http.post(this.baseUrl + requestParam.url, requestParam.data, httpOptions).pipe(
      mergeMap((data: ServerResponse) => {
        if (data.responseCode !== 'OK') {
          return observableThrowError(data);
        }
        return observableOf(data);
      }));
  }
  // post(requestParam: RequestParam): Observable<ServerResponse> {
  //   let httpOptions: HttpOptions = {
  //     headers: requestParam.header ? this.getHeader(requestParam.header) : this.getHeader(),
  //     params: requestParam.param
  //   };
  //   console.log('this.baseUrl', this.baseUrl);
  //   console.log('requestParam', requestParam);
  //   if(requestParam.url.includes('composite') || requestParam.url.includes('definition') || requestParam.url.includes('user')){
  //     console.log('inside if');
  //     httpOptions.headers = {...httpOptions.headers, "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGlfYWRtaW4ifQ.xKhN4Ufr5ow6weM7yX6DlNKON-HNk2nHdUyOwJSUpso", "x-authenticated-user-token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImFjY2Vzc192MV9rZXkxIn0.eyJhdWQiOiJodHRwczovL2Rldi5zdW5iaXJkZWQub3JnL2F1dGgvcmVhbG1zL3N1bmJpcmQiLCJzdWIiOiJmOmNhc3NhbmRyYWZlZGVyYXRpb25pZDo2N2U5MjJlOS1mZTBiLTRjOGQtYThlMy1hYjNmYWIxNTcyMGEiLCJyb2xlcyI6W3sicm9sZSI6IkNPTlRFTlRfQ1JFQVRPUiIsInNjb3BlIjpbeyJvcmdhbmlzYXRpb25JZCI6IjAxNDQxMTY2MTkxNjM3Mjk5MjAifV19LHsicm9sZSI6IlBVQkxJQyIsInNjb3BlIjpbXX1dLCJpc3MiOiJodHRwczovL2Rldi5zdW5iaXJkZWQub3JnL2F1dGgvcmVhbG1zL3N1bmJpcmQiLCJuYW1lIjoiQ29udGVudCBDcmVhdG9yIiwidHlwIjoiQmVhcmVyIiwiZXhwIjoxNzYwNjk1NjUyLCJpYXQiOjE3NjA2MDkyOTR9.e8Q1YcLqyEboPAW5e2F0Bpna6dhbvVS_GmWFbYB3B420UTxg6eroLKvqoT4seLXZqb7XljiZY8ZF70ridF0JEQbyYg4zuRYQDA3CMjWMuRe6cul1qUeIHg9RvldMhLVIRUhCSfmghjHKvoKxzRkKUkc-HJEFYxL_tnrtrHYHJ4XyYpLrtGqV-i33rTXK1WO-gIOs0U-2ibco1GdhtwH1u13d8dTh7Mq8kRhaIXMENzILcw7dT8HnqBKxUmFsypTSKAPgBRJqSanu8XE9WVrtxZMLEYlXcIXRlgZYJsd7M3m9zDjyNK7um0hVG2hWNXBfP7DZjc8h5h_cAjbKihL2hQ"};
  //   }

  //   console.log('httpOptions', httpOptions);

  //   return this.http.post(this.baseUrl + requestParam.url, requestParam.data, httpOptions).pipe(
  //     mergeMap((data: ServerResponse) => {
  //       if (data.responseCode !== 'OK') {
  //         return observableThrowError(data);
  //       }
  //       return observableOf(data);
  //     }));
  // }

  /**
   * for making patch api calls
   *
   * @param {RequestParam} requestParam interface
   *
   */
  patch(requestParam: RequestParam): Observable<ServerResponse> {
    const httpOptions: HttpOptions = {
      headers: requestParam.header ? requestParam.header : this.getHeader(),
      params: requestParam.param
    };
    return this.http.patch(this.baseUrl + requestParam.url, requestParam.data, httpOptions).pipe(
      mergeMap((data: ServerResponse) => {
        if (data.responseCode !== 'OK') {
          return observableThrowError(data);
        }
        return observableOf(data);
      }));
  }

  /**
   * for making delete api calls
   * @param {RequestParam} requestParam interface
   */
  delete(requestParam: RequestParam): Observable<ServerResponse> {
    const httpOptions: HttpOptions = {
      headers: requestParam.header ? requestParam.header : this.getHeader(),
      params: requestParam.param,
      body: requestParam.data
    };
    return this.http.delete(this.baseUrl + requestParam.url, httpOptions).pipe(
      mergeMap((data: ServerResponse) => {
        if (data.responseCode !== 'OK') {
          return observableThrowError(data);
        }
        return observableOf(data);
      }));
  }

  /**
 * for making PUT api calls
 * @param {RequestParam} requestParam interface
 */
  put(requestParam: RequestParam): Observable<ServerResponse> {
    const httpOptions: HttpOptions = {
      headers: requestParam.header,
      params: requestParam.param,
    };
    return this.http.put(this.baseUrl + requestParam.url, requestParam.data, httpOptions).pipe(
      mergeMap((data: ServerResponse) => {
        if (data.responseCode !== 'OK') {
          return observableThrowError(data);
        }
        return observableOf(data);
      }));
  }
  /**
   * for preparing headers
   */
  private getHeader(headers?: HttpOptions['headers']): HttpOptions['headers'] {
    const _uuid = UUID();
    const default_headers = {
      'Accept': 'application/json',
      // 'X-Consumer-ID': 'X-Consumer-ID',
      'X-Source': 'web',
      'ts': dayjs().format(),
      'X-msgid': _uuid,
      'X-Request-ID': _uuid,
      'X-App-Version': this.appVersion,
      'X-Session-ID': DataService.sessionId
    };
    try {
      this.deviceId = document.getElementById('deviceId')?(<HTMLInputElement>document.getElementById('deviceId')).value:'';
      this.appId = document.getElementById('appId')?(<HTMLInputElement>document.getElementById('appId')).value:'';
    } catch (err) { }
    if (this.deviceId) {
      default_headers['X-Device-ID'] = this.deviceId;
    }
    if (this.rootOrgId) {
      default_headers['X-Org-code'] = this.rootOrgId;
    }
    if (this.channelId) {
      default_headers['X-Channel-Id'] = this.channelId;
    }
    if (this.appId) {
      default_headers['X-App-Id'] = this.appId;
    }
    if (DataService.userId) {
      default_headers['X-User-ID'] = DataService.userId;
    }
    if (headers) {
      return { ...default_headers, ...headers };
    } else {
      return { ...default_headers };
    }
  }

  private getDateDiff(serverdate): number {
    const currentdate: any = new Date();
    const serverDate: any = new Date(serverdate);
    if (serverdate) {
      return (serverDate - currentdate) / 1000;
    } else {
      return 0;
    }
  }
}
