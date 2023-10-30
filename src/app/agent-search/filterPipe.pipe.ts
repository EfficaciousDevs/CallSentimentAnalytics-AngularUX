import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'filterData'
})
export class FilterDataPipe implements PipeTransform {

  transform(data: any[], agentNameFilter: string, callCategoryFilter: string, custSuppSentimentFilter: string, dateTimeFilter: Date, dateTimeFilterEnd: Date): any[] {
    return data.filter(user => {
      return (
        (agentNameFilter.length === 0 || user.agentName.toLowerCase().includes(agentNameFilter.toLowerCase())) &&
        (callCategoryFilter.length === 0 || user.callCategory.toLowerCase().includes(callCategoryFilter.toLowerCase())) &&
        (custSuppSentimentFilter.length === 0 || user.custSuppSentiment.toLowerCase().includes(custSuppSentimentFilter.toLowerCase())) &&
        (dateTimeFilter === undefined || user.dateTime >= dateTimeFilter.getDate() && user.dateTime <= dateTimeFilterEnd.getDate())
      );
    });
  }
}
