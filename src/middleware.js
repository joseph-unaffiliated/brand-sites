import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/') {
    const url = request.nextUrl.clone();

    if (searchParams.has('poll')) {
      url.pathname = '/poll';
      url.searchParams.delete('poll');
      return NextResponse.redirect(url);
    }

    if (searchParams.get('subscribed') === 'true') {
      url.pathname = '/subscribed';
      url.searchParams.delete('subscribed');
      return NextResponse.redirect(url);
    }

    if (searchParams.get('unsubscribed') === 'true') {
      url.pathname = '/unsubscribed';
      url.searchParams.delete('unsubscribed');
      return NextResponse.redirect(url);
    }

    if (searchParams.get('snoozed') === 'true') {
      url.pathname = '/snoozed';
      url.searchParams.delete('snoozed');
      return NextResponse.redirect(url);
    }

    if (searchParams.get('request') === 'true') {
      url.pathname = '/request';
      url.searchParams.delete('request');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
