import './polyfills';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ProdConfig } from './core/config/prod.config';
import { ArtemisAppModule } from './app.module';
import { ChartConfig } from 'app/core/charts/charts.config';

ProdConfig();
// ChartConfig();

if (module['hot']) {
    module['hot'].accept();
    if ('production' !== process.env.NODE_ENV) {
        console.clear();
    }
}

platformBrowserDynamic()
    .bootstrapModule(ArtemisAppModule, { preserveWhitespaces: true })
    .then(() => {})
    .catch((err) => console.error(err));
