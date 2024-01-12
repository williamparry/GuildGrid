# guildgrid.app

![image](./packages/web/public/android-chrome-192x192.png)

[Guild Grid](https://guildgrid.app) has been designed around using [Supabase](https://supabase.com/) and Discord. It is deployed to Digital Ocean.

## Notes

npm workspaces don't work with the Digital Ocean deployment, so you have to npm install in each of the packages individually, and the root project.

```
"workspaces": [
    "packages/*"
],
```

## Notice

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.