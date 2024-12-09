#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d haleyesthetics.is404.net --nginx --agree-tos --email awoll@byu.edu